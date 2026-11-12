import { beforeEach, describe, expect, it, vi } from "vitest";
import { installEditorResponder, readEditorText, requestEditorText } from "../src/editor-source";

function mountEditor(text: string, shape: "view" | "rootView" = "view"): void {
  document.body.innerHTML =
    '<div data-testid="media-viewer-popup"><div class="cm-editor"><div class="cm-content"></div></div></div>';
  const content = document.querySelector(".cm-content") as Element & { cmView?: unknown };
  const view = { state: { doc: { toString: () => text } } };
  content.cmView = shape === "view" ? { view } : { rootView: { view } };
}

describe("readEditorText", () => {
  it("reads the full document from the editor view", () => {
    mountEditor("<!doctype html>\n<p>hi</p>");
    expect(readEditorText(document)).toBe("<!doctype html>\n<p>hi</p>");
  });

  it("reads through rootView on other CodeMirror builds", () => {
    mountEditor("# Title", "rootView");
    expect(readEditorText(document)).toBe("# Title");
  });

  it("returns null without an editor", () => {
    expect(readEditorText(document)).toBeNull();
  });
});

describe("requestEditorText", () => {
  // jsdom's postMessage leaves event.source empty; deliver messages the way Chrome does.
  beforeEach(() => {
    vi.spyOn(window, "postMessage").mockImplementation((data: unknown) => {
      setTimeout(() => window.dispatchEvent(new MessageEvent("message", { data, source: window })));
    });
  });

  it("gets the text from the responder", async () => {
    mountEditor("body");
    installEditorResponder(window, 0);
    await expect(requestEditorText(window)).resolves.toBe("body");
  });

  it("gets null when the viewer has no editor, without waiting for the timeout", async () => {
    installEditorResponder(window, 0);
    await expect(requestEditorText(window, 60_000)).resolves.toBeNull();
  });

  it("ignores messages from other windows", async () => {
    mountEditor("body");
    installEditorResponder(window, 0);
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "jira-attachment-preview:editor-request", requestId: "x" },
        source: null,
      }),
    );
    await expect(requestEditorText(window, 50)).resolves.toBe("body");
  });

  it("times out when nothing answers", async () => {
    await expect(requestEditorText(window, 10)).resolves.toBeNull();
  });
});
