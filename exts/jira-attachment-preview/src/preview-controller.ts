// Drives one attachment viewer: decides whether a file gets a Preview, loads its content, frames
// the sandboxed preview page and handles the toggle.
import {
  byteLength,
  type DisplayedSize,
  MAX_PREVIEW_BYTES,
  matchesDisplayedSize,
  type PreviewKind,
  parseDisplayedSize,
  previewKind,
} from "./file-type";
import { log, logError } from "./log";
import { OPEN_TAB_TYPE, type OpenTabMessage, type PreviewPayload, type Theme } from "./messages";
import { PreviewError, TOO_LARGE_REASON } from "./preview-error";
import { framePreview } from "./preview-frame";
import type { RestSourceInput } from "./rest-source";
import {
  type Controls,
  mountControls,
  mountPreviewHost,
  removeAdded,
  type ViewerFile,
} from "./viewer";

export interface ControllerDeps {
  win: Window;
  pageUrl(): string;
  requestEditorText(win: Window): Promise<string | null>;
  fetchAttachmentText(input: RestSourceInput): Promise<string>;
  previewUrl: string;
  sendMessage(message: OpenTabMessage): Promise<unknown>;
}

/** How often, and how long, to wait for the editor to drop the previous file after a switch. */
const STALE_RETRY_MS = 250;
const STALE_RETRIES = 6;

export function jiraTheme(doc: Document): Theme {
  return doc.documentElement.dataset.colorMode === "dark" ? "dark" : "light";
}

export class PreviewController {
  private generation = 0;
  private controls: Controls | null = null;
  private host: HTMLElement | null = null;
  private lastPayload: PreviewPayload | null = null;
  /** The editor text used for the previous file, to spot an editor that has not switched yet. */
  private previousEditorText: string | null = null;

  constructor(private readonly deps: ControllerDeps) {}

  /** False when Jira re-rendered away the controls or the Preview this controller added. */
  isIntact(): boolean {
    if (this.controls && !this.controls.root.isConnected) return false;
    return !(this.host && !this.host.isConnected);
  }

  /** Handles the viewer opening a file, switching to another, or closing (null). */
  async show(file: ViewerFile | null): Promise<void> {
    const generation = ++this.generation;
    removeAdded(this.deps.win.document);
    this.controls = null;
    this.host = null;
    this.lastPayload = null;
    if (!file) return;
    const kind = previewKind(file.name);
    if (!kind) return;

    const controls = mountControls(file, {
      onPreview: () => this.setVisible(true),
      onSource: () => this.setVisible(false),
      onOpenTab: () => this.openTab(file, kind),
    });
    this.controls = controls;
    controls.setState("loading");

    try {
      const content = await this.loadContent(file, generation);
      if (generation !== this.generation) return;
      const payload = this.payload(file, kind, content);
      this.lastPayload = payload;
      const host = mountPreviewHost(file);
      this.host = host;
      framePreview(host, payload, this.deps.previewUrl);
      controls.setState("preview");
      log("preview shown", file.name);
    } catch (error) {
      if (generation !== this.generation) return;
      const reason = error instanceof PreviewError ? error.message : "could not load the file";
      if (!(error instanceof PreviewError)) logError("preview failed", file.name, error);
      else log("no preview", file.name, reason);
      controls.setState("error", reason);
    }
  }

  private async loadContent(file: ViewerFile, generation: number): Promise<string> {
    const displayed = parseDisplayedSize(file.sizeText);
    if (displayed && displayed.bytes - displayed.unit / 2 > MAX_PREVIEW_BYTES) {
      throw new PreviewError(TOO_LARGE_REASON);
    }
    const content =
      (await this.editorText(displayed, generation)) ??
      (await this.deps.fetchAttachmentText({
        pageUrl: this.deps.pageUrl(),
        fileName: file.name,
        sizeText: file.sizeText,
      }));
    if (byteLength(content) > MAX_PREVIEW_BYTES) throw new PreviewError(TOO_LARGE_REASON);
    return content;
  }

  /**
   * The editor's text, or null when there is none or it still holds the previous file. Right
   * after a file switch Jira may not have replaced the editor yet: its text is then the previous
   * file's (waited out, then given up on) or has a size other than the one the viewer shows.
   */
  private async editorText(
    displayed: DisplayedSize | null,
    generation: number,
  ): Promise<string | null> {
    let text = await this.deps.requestEditorText(this.deps.win);
    for (
      let retry = 0;
      text !== null && text === this.previousEditorText && retry < STALE_RETRIES;
      retry++
    ) {
      await new Promise((resolve) => setTimeout(resolve, STALE_RETRY_MS));
      if (generation !== this.generation) return null;
      text = await this.deps.requestEditorText(this.deps.win);
    }
    if (text === null) return null;
    if (text === this.previousEditorText) {
      log("editor still shows the previous file; using Jira REST");
      return null;
    }
    if (displayed !== null && !matchesDisplayedSize(byteLength(text), displayed)) {
      log("editor text does not match the displayed size; using Jira REST");
      return null;
    }
    this.previousEditorText = text;
    return text;
  }

  private payload(file: ViewerFile, kind: PreviewKind, content: string): PreviewPayload {
    return { fileName: file.name, kind, content, theme: jiraTheme(this.deps.win.document) };
  }

  private setVisible(visible: boolean): void {
    if (!this.host || !this.controls) return;
    this.host.hidden = !visible;
    this.controls.setState(visible ? "preview" : "source");
  }

  private openTab(file: ViewerFile, kind: PreviewKind): void {
    const snapshot = this.lastPayload;
    if (!snapshot || snapshot.fileName !== file.name || snapshot.kind !== kind) return;
    void this.deps.sendMessage({ type: OPEN_TAB_TYPE, snapshot });
  }
}
