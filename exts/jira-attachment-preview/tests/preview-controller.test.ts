import { describe, expect, it, vi } from "vitest";
import { type ControllerDeps, jiraTheme, PreviewController } from "../src/preview-controller";
import { PreviewError } from "../src/preview-error";
import { ADDED_ATTRIBUTE, readViewer } from "../src/viewer";
import { openViewer, switchFile } from "./fixtures/viewer";

/** Editor text whose size matches the fixture's "html · 14 KB". */
const EDITOR_TEXT = `<p>from editor</p>${" ".repeat(14 * 1024 - 18)}`;

function deps(overrides: Partial<ControllerDeps> = {}): ControllerDeps {
  return {
    win: window,
    pageUrl: () => "https://example.atlassian.net/browse/S-1",
    requestEditorText: vi.fn(async () => EDITOR_TEXT),
    fetchAttachmentText: vi.fn(async () => "<p>from rest</p>"),
    previewUrl: "about:blank",
    sendMessage: vi.fn(async () => undefined),
    ...overrides,
  };
}

function current() {
  const file = readViewer(document);
  if (!file) throw new Error("no viewer");
  return file;
}

function status(): string {
  return document.querySelector('[role="status"]')?.textContent ?? "";
}

function click(label: string): void {
  const button = [...document.querySelectorAll("button")].find((b) => b.textContent === label);
  button?.click();
}

const host = () => document.querySelector<HTMLElement>(`[${ADDED_ATTRIBUTE}="preview"]`);

describe("PreviewController", () => {
  it("shows the Preview by default, from the editor text", async () => {
    openViewer();
    const d = deps();
    await new PreviewController(d).show(current());
    expect(host()?.querySelector("iframe")?.getAttribute("sandbox")).toBe("allow-scripts");
    expect(host()?.hidden).toBe(false);
    expect(d.fetchAttachmentText).not.toHaveBeenCalled();
  });

  it("toggles between Source and Preview", async () => {
    openViewer();
    await new PreviewController(deps()).show(current());
    click("Source");
    expect(host()?.hidden).toBe(true);
    click("Preview");
    expect(host()?.hidden).toBe(false);
  });

  it("falls back to Jira REST when the viewer shows no editor", async () => {
    openViewer();
    const d = deps({ requestEditorText: vi.fn(async () => null) });
    await new PreviewController(d).show(current());
    expect(d.fetchAttachmentText).toHaveBeenCalledWith({
      pageUrl: "https://example.atlassian.net/browse/S-1",
      fileName: "proto.html",
      sizeText: "html · 14 KB",
    });
    expect(host()).not.toBeNull();
  });

  it("uses Jira REST when the editor still holds a file of another size", async () => {
    openViewer("proto.html", "html · 14 KB");
    const d = deps({ requestEditorText: vi.fn(async () => "<p>previous file</p>") });
    await new PreviewController(d).show(current());
    expect(d.fetchAttachmentText).toHaveBeenCalled();
  });

  it("adds nothing for an unsupported file", async () => {
    openViewer("notes.txt", "txt · 1 KB");
    await new PreviewController(deps()).show(current());
    expect(document.querySelectorAll(`[${ADDED_ATTRIBUTE}]`)).toHaveLength(0);
  });

  it("refuses a file the viewer shows as over 5 MB without loading it", async () => {
    openViewer("big.html", "html · 6 MB");
    const d = deps();
    await new PreviewController(d).show(current());
    expect(status()).toBe("file larger than 5 MB");
    expect(d.requestEditorText).not.toHaveBeenCalled();
    expect(host()).toBeNull();
  });

  it("refuses content over 5 MB", async () => {
    openViewer("big.html", "html · 5 MB");
    const big = "x".repeat(5 * 1024 * 1024 + 1);
    await new PreviewController(deps({ requestEditorText: vi.fn(async () => big) })).show(
      current(),
    );
    expect(status()).toBe("file larger than 5 MB");
  });

  it("shows the reason when the content cannot be loaded", async () => {
    openViewer();
    const d = deps({
      requestEditorText: vi.fn(async () => null),
      fetchAttachmentText: vi.fn(async () => {
        throw new PreviewError("Jira returned 403");
      }),
    });
    await new PreviewController(d).show(current());
    expect(status()).toBe("Jira returned 403");
    expect(host()).toBeNull();
  });

  it("drops a stale load when the user switches file", async () => {
    openViewer();
    let release: (text: string) => void = () => {};
    const slow = new Promise<string>((resolve) => {
      release = resolve;
    });
    const controller = new PreviewController(
      deps({ requestEditorText: vi.fn().mockReturnValueOnce(slow).mockResolvedValue("# B") }),
    );
    const first = controller.show(current());
    switchFile("b.md", "md · 1 KB");
    await controller.show(current());
    release("<p>stale</p>");
    await first;
    expect(document.querySelectorAll(`[${ADDED_ATTRIBUTE}="preview"]`)).toHaveLength(1);
    expect(host()?.querySelector("iframe")?.title).toBe("Preview of b.md");
  });

  it("removes everything when the viewer closes", async () => {
    openViewer();
    const controller = new PreviewController(deps());
    await controller.show(current());
    await controller.show(null);
    expect(document.querySelectorAll(`[${ADDED_ATTRIBUTE}]`)).toHaveLength(0);
  });

  it("sends the snapshot to the background for a new tab", async () => {
    openViewer();
    document.documentElement.dataset.colorMode = "dark";
    const d = deps();
    await new PreviewController(d).show(current());
    click("Open in new tab");
    expect(d.sendMessage).toHaveBeenCalledWith({
      type: "jira-attachment-preview:open-tab",
      snapshot: {
        fileName: "proto.html",
        kind: "html",
        content: EDITOR_TEXT,
        theme: "dark",
      },
    });
  });

  it("reports when Jira re-rendered the controls away", async () => {
    openViewer();
    const controller = new PreviewController(deps());
    await controller.show(current());
    expect(controller.isIntact()).toBe(true);
    document.querySelector(`[${ADDED_ATTRIBUTE}="controls"]`)?.remove();
    expect(controller.isIntact()).toBe(false);
  });
});

describe("jiraTheme", () => {
  it("follows Jira's colour mode", () => {
    expect(jiraTheme(document)).toBe("light");
    document.documentElement.dataset.colorMode = "dark";
    expect(jiraTheme(document)).toBe("dark");
  });
});
