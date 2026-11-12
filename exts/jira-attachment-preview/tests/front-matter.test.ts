import { describe, expect, it } from "vitest";
import { splitFrontMatter } from "../src/front-matter";
import { markdownToSafeHtml } from "../src/markdown";

const REVIEW = `---
pr: 244
title: "[SCRUM-2197] feat: edit the whole set of a deal file's assets"
branch: feature/SCRUM-2197
human_approved: false
reviewed_at: 2026-11-11T22:40:00Z
commit: fc91af43
---
# Review
`;

describe("splitFrontMatter", () => {
  it("splits flat fields off the body, unquoting values", () => {
    const { frontMatter, body } = splitFrontMatter(REVIEW);
    expect(frontMatter?.fields).toEqual([
      ["pr", "244"],
      ["title", "[SCRUM-2197] feat: edit the whole set of a deal file's assets"],
      ["branch", "feature/SCRUM-2197"],
      ["human_approved", "false"],
      ["reviewed_at", "2026-11-11T22:40:00Z"],
      ["commit", "fc91af43"],
    ]);
    expect(body).toBe("# Review\n");
  });

  it("keeps nested YAML as raw text", () => {
    const { frontMatter } = splitFrontMatter("---\ntags:\n  - a\n  - b\n---\nbody");
    expect(frontMatter).toEqual({ yaml: "tags:\n  - a\n  - b", fields: null });
  });

  it("treats block scalars as not flat", () => {
    expect(splitFrontMatter("---\nnote: |\n  long\n---\n").frontMatter?.fields).toBeNull();
  });

  it("ignores a --- that does not open the file", () => {
    const markdown = "# Title\n\n---\na: 1\n---\n";
    expect(splitFrontMatter(markdown)).toEqual({ frontMatter: null, body: markdown });
  });

  it("accepts CRLF line endings and a closing ...", () => {
    const { frontMatter, body } = splitFrontMatter("---\r\na: 1\r\n...\r\ntext");
    expect(frontMatter?.fields).toEqual([["a", "1"]]);
    expect(body).toBe("text");
  });
});

describe("markdownToSafeHtml with front matter", () => {
  it("shows flat front matter as a table before the body", () => {
    const html = markdownToSafeHtml(REVIEW);
    expect(html.indexOf('<table class="front-matter">')).toBe(0);
    expect(html).toContain("<th>pr</th><td>244</td>");
    expect(html).toContain("<h1>Review</h1>");
    expect(html).not.toContain("<hr>");
  });

  it("shows nested front matter as highlighted YAML", () => {
    const html = markdownToSafeHtml("---\ntags:\n  - a\n---\nbody");
    expect(html).toContain('<div class="front-matter"><pre><code class="hljs language-yaml">');
  });

  it("escapes markup in values", () => {
    const html = markdownToSafeHtml('---\ntitle: "<img src=x onerror=alert(1)>"\n---\n');
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).not.toContain("<img");
  });
});
