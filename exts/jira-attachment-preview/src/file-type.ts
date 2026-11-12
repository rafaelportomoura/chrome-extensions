// Which attachments get a Preview, and the size rules shared by every content source.

export type PreviewKind = "html" | "markdown";

/** Files larger than this are never previewed. */
export const MAX_PREVIEW_BYTES = 5 * 1024 * 1024;

const KIND_BY_EXTENSION: Record<string, PreviewKind> = {
  html: "html",
  htm: "html",
  md: "markdown",
  markdown: "markdown",
};

/** The Preview kind for a file name, decided by its extension only; null when unsupported. */
export function previewKind(fileName: string): PreviewKind | null {
  const match = /\.([a-z0-9]+)$/i.exec(fileName.trim());
  if (!match?.[1]) return null;
  return KIND_BY_EXTENSION[match[1].toLowerCase()] ?? null;
}

const UNIT_BYTES: Record<string, number> = {
  B: 1,
  KB: 1024,
  MB: 1024 ** 2,
  GB: 1024 ** 3,
};

export interface DisplayedSize {
  bytes: number;
  /** Bytes in one step of the displayed unit; the display is rounded to it. */
  unit: number;
}

/** Parses the size shown by the attachment viewer, e.g. "html · 14 KB" or "1,5 MB". */
export function parseDisplayedSize(text: string): DisplayedSize | null {
  const match = /(\d+(?:[.,]\d+)?)\s*(B|KB|MB|GB)\b/i.exec(text);
  if (!match?.[1] || !match[2]) return null;
  const unit = UNIT_BYTES[match[2].toUpperCase()];
  if (unit === undefined) return null;
  return { bytes: Number.parseFloat(match[1].replace(",", ".")) * unit, unit };
}

/** True when an exact byte count is consistent with the rounded size the viewer shows. */
export function matchesDisplayedSize(bytes: number, displayed: DisplayedSize): boolean {
  return Math.abs(bytes - displayed.bytes) <= displayed.unit;
}

/** UTF-8 size of a text. */
export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}
