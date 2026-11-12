// Adapter for Jira's attachment viewer: finds the file it shows and adds the extension's controls
// and Preview to it. Every added element carries ADDED_ATTRIBUTE so it can be removed as a set.

export const ADDED_ATTRIBUTE = "data-jira-attachment-preview";

const VIEWER = '[data-testid="media-viewer-popup"]';
const FILE_NAME = '[data-testid="media-viewer-file-name"]';
const FILE_METADATA = '[data-testid="media-viewer-file-metadata-text"]';
const DOWNLOAD_BUTTON = '[data-testid="media-viewer-download-button"]';

export interface ViewerFile {
  /** The attachment viewer's root element. */
  viewer: HTMLElement;
  name: string;
  /** The viewer's metadata text, e.g. "html · 14 KB". */
  sizeText: string;
}

/** The file the open attachment viewer shows, or null when no viewer is open. */
export function readViewer(doc: Document): ViewerFile | null {
  const viewer = doc.querySelector<HTMLElement>(VIEWER);
  const name = viewer?.querySelector(FILE_NAME)?.textContent?.trim();
  if (!viewer || !name) return null;
  const sizeText = viewer.querySelector(FILE_METADATA)?.textContent?.trim() ?? "";
  return { viewer, name, sizeText };
}

/**
 * Calls `onChange` whenever the viewer opens, switches file or closes (with null), and again for
 * the same file when `isIntact` reports that Jira re-rendered away what was added. Returns a
 * function that stops watching.
 */
export function watchViewer(
  doc: Document,
  onChange: (file: ViewerFile | null) => void,
  isIntact: () => boolean = () => true,
): () => void {
  let current: ViewerFile | null = null;
  const check = (): void => {
    const next = readViewer(doc);
    const same =
      next?.viewer === current?.viewer &&
      next?.name === current?.name &&
      next?.sizeText === current?.sizeText;
    if (same && isIntact()) return;
    current = next;
    onChange(next);
  };
  const observer = new MutationObserver(check);
  observer.observe(doc.body, { childList: true, subtree: true, characterData: true });
  check();
  return () => observer.disconnect();
}

/** Removes everything the extension added to the page. */
export function removeAdded(doc: Document): void {
  for (const element of doc.querySelectorAll(`[${ADDED_ATTRIBUTE}]`)) element.remove();
}

export type ControlsState = "loading" | "preview" | "source" | "error";

export interface ControlsHandlers {
  onPreview(): void;
  onSource(): void;
  onOpenTab(): void;
}

export interface Controls {
  root: HTMLElement;
  setState(state: ControlsState, message?: string): void;
}

const BUTTON_STYLE =
  "font:500 13px/20px inherit;padding:4px 10px;border:1px solid rgba(255,255,255,.35);" +
  "background:transparent;color:#fff;cursor:pointer;";

function button(doc: Document, label: string, onClick: () => void): HTMLButtonElement {
  const element = doc.createElement("button");
  element.type = "button";
  element.textContent = label;
  element.style.cssText = BUTTON_STYLE;
  element.addEventListener("click", onClick);
  return element;
}

/** Adds the "Preview / Source" toggle and "Open in new tab" left of the download button. */
export function mountControls(file: ViewerFile, handlers: ControlsHandlers): Controls {
  const doc = file.viewer.ownerDocument;
  const root = doc.createElement("div");
  root.setAttribute(ADDED_ATTRIBUTE, "controls");
  root.style.cssText =
    "display:inline-flex;align-items:center;gap:8px;margin-right:8px;color:#fff;font-size:13px;";

  const preview = button(doc, "Preview", handlers.onPreview);
  preview.style.borderRadius = "4px 0 0 4px";
  const source = button(doc, "Source", handlers.onSource);
  source.style.borderRadius = "0 4px 4px 0";
  source.style.marginLeft = "-1px";
  const toggle = doc.createElement("span");
  toggle.setAttribute("role", "group");
  toggle.setAttribute("aria-label", "Preview / Source");
  toggle.style.display = "inline-flex";
  toggle.append(preview, source);

  const openTab = button(doc, "Open in new tab", handlers.onOpenTab);
  openTab.style.borderRadius = "4px";
  const status = doc.createElement("span");
  status.setAttribute("role", "status");
  status.style.cssText = "color:#ffb3a8;max-width:24em;";

  root.append(status, toggle, openTab);
  const download = file.viewer.querySelector(DOWNLOAD_BUTTON);
  if (download) download.before(root);
  else file.viewer.append(root);

  const select = (active: HTMLButtonElement | null): void => {
    for (const element of [preview, source]) {
      const on = element === active;
      element.setAttribute("aria-pressed", String(on));
      element.style.background = on ? "rgba(255,255,255,.2)" : "transparent";
    }
  };

  return {
    root,
    setState(state, message) {
      status.textContent = state === "loading" ? "Loading preview…" : (message ?? "");
      const ready = state === "preview" || state === "source";
      preview.disabled = !ready;
      openTab.disabled = !ready;
      openTab.hidden = state === "error";
      preview.hidden = state === "error";
      source.hidden = state === "error";
      select(state === "preview" ? preview : state === "source" ? source : null);
    },
  };
}

const FALLBACK_HEADER_HEIGHT = 56;

/** Top offset, inside the viewer, of the area below its header. */
function contentTop(file: ViewerFile): number {
  const name = file.viewer.querySelector(FILE_NAME);
  const download = file.viewer.querySelector(DOWNLOAD_BUTTON);
  let header: Element | null = name?.parentElement ?? null;
  while (header && download && !header.contains(download)) header = header.parentElement;
  if (!header || header === file.viewer) return FALLBACK_HEADER_HEIGHT;
  const top = header.getBoundingClientRect().bottom - file.viewer.getBoundingClientRect().top;
  return top > 0 ? top : FALLBACK_HEADER_HEIGHT;
}

/** Adds the element that holds the Preview, covering the viewer below its header. */
export function mountPreviewHost(file: ViewerFile): HTMLElement {
  const doc = file.viewer.ownerDocument;
  // The host is positioned against the viewer, so the viewer must be a positioned element.
  if (doc.defaultView?.getComputedStyle(file.viewer).position === "static") {
    file.viewer.style.position = "relative";
  }
  const host = doc.createElement("div");
  host.setAttribute(ADDED_ATTRIBUTE, "preview");
  host.style.cssText = `position:absolute;left:0;right:0;bottom:0;top:${contentTop(file)}px;z-index:1;background:#fff;`;
  file.viewer.append(host);
  return host;
}
