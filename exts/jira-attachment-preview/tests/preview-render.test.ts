import { describe, expect, it, vi } from "vitest";
import type { MermaidApi } from "../src/markdown";
import { RENDER_TYPE, type RenderMessage } from "../src/messages";
import { applyRender, listenForRender } from "../src/preview-render";

const mermaid: MermaidApi = { initialize: vi.fn(), render: vi.fn(async () => ({ svg: "<svg/>" })) };

function message(overrides: Partial<RenderMessage>): RenderMessage {
  return {
    type: RENDER_TYPE,
    fileName: "notes.md",
    kind: "markdown",
    content: "# Title",
    theme: "light",
    ...overrides,
  };
}

describe("applyRender", () => {
  it("writes an HTML file as the whole document", async () => {
    const open = vi.spyOn(document, "open").mockImplementation((() => document) as never);
    const write = vi.spyOn(document, "write").mockImplementation(() => {});
    vi.spyOn(document, "close").mockImplementation(() => {});
    await applyRender(document, message({ kind: "html", content: "<h1>Hi</h1>" }), mermaid);
    expect(open).toHaveBeenCalled();
    expect(write).toHaveBeenCalledWith("<h1>Hi</h1>");
  });

  it("renders Markdown into the page with the theme", async () => {
    await applyRender(document, message({ theme: "dark" }), mermaid);
    expect(document.querySelector(".markdown-body h1")?.textContent).toBe("Title");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.title).toBe("notes.md");
  });
});

describe("listenForRender", () => {
  it("announces readiness and renders the parent's message", async () => {
    const post = vi.spyOn(window.parent, "postMessage");
    listenForRender(window, (doc, m) => applyRender(doc, m, mermaid));
    expect(post).toHaveBeenCalledWith({ type: "jira-attachment-preview:ready" }, "*");
    window.dispatchEvent(new MessageEvent("message", { data: message({}), source: window.parent }));
    await vi.waitFor(() => expect(document.querySelector(".markdown-body")).not.toBeNull());
  });

  it("ignores malformed messages", () => {
    listenForRender(window, (doc, m) => applyRender(doc, m, mermaid));
    window.dispatchEvent(
      new MessageEvent("message", { data: { type: RENDER_TYPE, kind: "exe" }, source: window }),
    );
    expect(document.querySelector(".markdown-body")).toBeNull();
  });
});
