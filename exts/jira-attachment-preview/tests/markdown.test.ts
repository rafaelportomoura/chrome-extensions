import { describe, expect, it, vi } from "vitest";
import { type MermaidApi, markdownToSafeHtml, renderMermaidBlocks } from "../src/markdown";

describe("markdownToSafeHtml", () => {
  it("renders GitHub-flavoured tables and task lists", () => {
    const html = markdownToSafeHtml("| a | b |\n|---|---|\n| 1 | 2 |\n\n- [x] done\n");
    expect(html).toContain("<table>");
    expect(html).toContain('type="checkbox"');
  });

  it("highlights a fenced block with a known language", () => {
    const html = markdownToSafeHtml("```ts\nconst a = 1;\n```\n");
    expect(html).toContain('class="hljs language-ts"');
    expect(html).toContain("hljs-keyword");
  });

  it("escapes a block with an unknown language", () => {
    const html = markdownToSafeHtml("```nope\n<b>x</b>\n```\n");
    expect(html).toContain("&lt;b&gt;x&lt;/b&gt;");
  });

  it("keeps Mermaid blocks for the diagram pass", () => {
    const html = markdownToSafeHtml("```mermaid\ngraph TD; A-->B\n```\n");
    expect(html).toContain('<pre class="mermaid">graph TD; A--&gt;B</pre>');
  });

  it("removes scripts, event handlers and javascript: URLs", () => {
    const html = markdownToSafeHtml(
      '<script>alert(1)</script>\n\n<img src="x" onerror="alert(2)">\n\n[link](javascript:alert(3))\n',
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("javascript:");
  });
});

describe("renderMermaidBlocks", () => {
  function api(render: MermaidApi["render"]): MermaidApi {
    return { initialize: vi.fn(), render: vi.fn(render) };
  }

  it("replaces a block with its diagram, themed", async () => {
    document.body.innerHTML = '<pre class="mermaid">graph TD; A--&gt;B</pre>';
    const mermaid = api(async () => ({ svg: "<svg id='d'></svg>" }));
    await renderMermaidBlocks(document.body, "dark", mermaid);
    expect(mermaid.initialize).toHaveBeenCalledWith(expect.objectContaining({ theme: "dark" }));
    expect(mermaid.render).toHaveBeenCalledWith("mermaid-0", "graph TD; A-->B");
    expect(document.querySelector(".mermaid-diagram svg")).not.toBeNull();
  });

  it("shows the source and the parser message when a block fails", async () => {
    document.body.innerHTML = '<pre class="mermaid">graph ??</pre>';
    await renderMermaidBlocks(
      document.body,
      "light",
      api(async () => {
        throw new Error("Parse error on line 1");
      }),
    );
    const error = document.querySelector(".mermaid-error");
    expect(error?.textContent).toContain("Parse error on line 1");
    expect(error?.querySelector("pre")?.textContent).toBe("graph ??");
  });

  it("does nothing without Mermaid blocks", async () => {
    const mermaid = api(async () => ({ svg: "" }));
    await renderMermaidBlocks(document.body, "light", mermaid);
    expect(mermaid.initialize).not.toHaveBeenCalled();
  });
});
