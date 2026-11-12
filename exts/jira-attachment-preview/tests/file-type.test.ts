import { describe, expect, it } from "vitest";
import {
  byteLength,
  MAX_PREVIEW_BYTES,
  matchesDisplayedSize,
  parseDisplayedSize,
  previewKind,
  previewPage,
} from "../src/file-type";

describe("previewKind", () => {
  it.each([
    ["prototype.html", "html"],
    ["page.HTM", "html"],
    ["notes.md", "markdown"],
    ["README.Markdown", "markdown"],
    ["flow.excalidraw", "excalidraw"],
    ["Flow.EXCALIDRAW", "excalidraw"],
    ["flow.excalidraw.json", "excalidraw"],
    ["Flow.Excalidraw.JSON", "excalidraw"],
    ["drawing.excalidraw.md", "markdown"],
  ])("maps %s to %s", (name, kind) => {
    expect(previewKind(name)).toBe(kind);
  });

  it.each([
    "logo.svg",
    "Makefile",
    "page.html.txt",
    "notes.mdx",
    "",
    "notes.json",
    "drawing.excalidraw.svg",
    "drawing.excalidraw.png",
  ])("leaves %s unsupported", (name) => {
    expect(previewKind(name)).toBeNull();
  });
});

describe("previewPage", () => {
  it("renders drawings in the Excalidraw page and the rest in the preview page", () => {
    expect(previewPage("excalidraw")).toBe("excalidraw.html");
    expect(previewPage("html")).toBe("preview.html");
    expect(previewPage("markdown")).toBe("preview.html");
  });
});

describe("parseDisplayedSize", () => {
  it("reads the viewer metadata text", () => {
    expect(parseDisplayedSize("html · 14 KB")).toEqual({ bytes: 14 * 1024, unit: 1024 });
  });

  it("accepts a decimal comma", () => {
    expect(parseDisplayedSize("md · 1,5 MB")?.bytes).toBe(1.5 * 1024 ** 2);
  });

  it("returns null without a size", () => {
    expect(parseDisplayedSize("html")).toBeNull();
  });
});

describe("matchesDisplayedSize", () => {
  const displayed = { bytes: 14 * 1024, unit: 1024 };

  it("accepts a byte count that rounds to the shown size", () => {
    expect(matchesDisplayedSize(13913, displayed)).toBe(true);
  });

  it("rejects a byte count far from the shown size", () => {
    expect(matchesDisplayedSize(20 * 1024, displayed)).toBe(false);
  });
});

describe("byteLength", () => {
  it("counts UTF-8 bytes", () => {
    expect(byteLength("ação")).toBe(6);
  });

  it("puts the limit at 5 MB", () => {
    expect(MAX_PREVIEW_BYTES).toBe(5_242_880);
  });
});
