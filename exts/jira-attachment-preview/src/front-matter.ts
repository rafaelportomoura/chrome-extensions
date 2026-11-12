// YAML front matter: the `---` block that opens many Markdown files (e.g. `title: ...`). It is not
// Markdown, so it is split off and shown on its own, as GitHub does.

export interface FrontMatter {
  /** The YAML between the `---` fences, without them. */
  yaml: string;
  /** `key: value` pairs when every line is one; null for nested or multi-line YAML. */
  fields: [key: string, value: string][] | null;
}

const BLOCK = /^﻿?---[ \t]*\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/;
const FIELD = /^([A-Za-z0-9_][\w.-]*)[ \t]*:(?:[ \t]+(.*))?$/;

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && /^(["']).*\1$/.test(trimmed)) {
    const inner = trimmed.slice(1, -1);
    return trimmed.startsWith('"') ? inner.replace(/\\"/g, '"') : inner.replace(/''/g, "'");
  }
  return trimmed;
}

function parseFields(yaml: string): FrontMatter["fields"] {
  const fields: [string, string][] = [];
  for (const line of yaml.split(/\r?\n/)) {
    if (line.trim() === "" || line.trimStart().startsWith("#")) continue;
    const match = FIELD.exec(line);
    if (!match?.[1]) return null;
    const value = match[2] ?? "";
    // A value that opens a block (`|`, `>`) or a nested map/list on the next lines is not flat.
    if (/^[|>]/.test(value.trim())) return null;
    fields.push([match[1], unquote(value)]);
  }
  return fields;
}

/** Splits a leading front matter block off the Markdown; `frontMatter` is null without one. */
export function splitFrontMatter(markdown: string): {
  frontMatter: FrontMatter | null;
  body: string;
} {
  const match = BLOCK.exec(markdown);
  if (!match) return { frontMatter: null, body: markdown };
  const yaml = match[1] ?? "";
  return {
    frontMatter: { yaml, fields: parseFields(yaml) },
    body: markdown.slice(match[0].length),
  };
}
