// Turns Markdown into the sanitised HTML of a Markdown Preview: YAML front matter as a table,
// GitHub-flavoured Markdown, highlighted code blocks and Mermaid diagrams. Runs inside the
// sandboxed preview page.
import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/common";
import { Marked, type Tokens } from "marked";
import { type FrontMatter, splitFrontMatter } from "./front-matter";
import type { Theme } from "./messages";

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderCode({ text, lang }: Tokens.Code): string {
  const language = (lang ?? "").trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (language === "mermaid") return `<pre class="mermaid">${escapeHtml(text)}</pre>\n`;
  if (language && hljs.getLanguage(language)) {
    const highlighted = hljs.highlight(text, { language, ignoreIllegals: true }).value;
    return `<pre><code class="hljs language-${escapeHtml(language)}">${highlighted}</code></pre>\n`;
  }
  return `<pre><code class="hljs">${escapeHtml(text)}</code></pre>\n`;
}

const marked = new Marked({ gfm: true, async: false, renderer: { code: renderCode } });

/** Front matter as a two-column table, or as highlighted YAML when it is not flat. */
function renderFrontMatter({ yaml, fields }: FrontMatter): string {
  if (fields === null) {
    return `<div class="front-matter">${renderCode({ type: "code", raw: yaml, text: yaml, lang: "yaml" })}</div>\n`;
  }
  const rows = fields
    .map(([key, value]) => `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join("");
  return `<table class="front-matter"><tbody>${rows}</tbody></table>\n`;
}

/** Markdown to HTML with scripts, event handlers and `javascript:` URLs removed. */
export function markdownToSafeHtml(markdown: string): string {
  const { frontMatter, body } = splitFrontMatter(markdown);
  const header = frontMatter ? renderFrontMatter(frontMatter) : "";
  const html = header + (marked.parse(body) as string);
  return DOMPurify.sanitize(html);
}

/** The part of the Mermaid API the renderer uses; injected so tests run without it. */
export interface MermaidApi {
  initialize(config: {
    startOnLoad: boolean;
    theme: "dark" | "default";
    securityLevel: "strict";
  }): void;
  render(id: string, text: string): Promise<{ svg: string }>;
}

/** Replaces every `pre.mermaid` block under `root` with its diagram, or with its parse error. */
export async function renderMermaidBlocks(
  root: ParentNode,
  theme: Theme,
  mermaid: MermaidApi,
): Promise<void> {
  const blocks = [...root.querySelectorAll<HTMLElement>("pre.mermaid")];
  if (blocks.length === 0) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: theme === "dark" ? "dark" : "default",
    securityLevel: "strict",
  });
  for (const [index, block] of blocks.entries()) {
    const source = block.textContent ?? "";
    const figure = block.ownerDocument.createElement("div");
    figure.className = "mermaid-diagram";
    try {
      const { svg } = await mermaid.render(`mermaid-${index}`, source);
      figure.innerHTML = svg;
    } catch (error) {
      figure.classList.add("mermaid-error");
      const message = block.ownerDocument.createElement("p");
      message.textContent = `Mermaid: ${error instanceof Error ? error.message : String(error)}`;
      const code = block.ownerDocument.createElement("pre");
      code.textContent = source;
      figure.append(message, code);
    }
    block.replaceWith(figure);
  }
}
