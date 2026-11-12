import { describe, expect, it } from "vitest";
import { INVALID_EXCALIDRAW_REASON, parseScene } from "../src/excalidraw-scene";

const rect = { id: "a", type: "rectangle", x: 0, y: 0, width: 10, height: 10 };

function file(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    type: "excalidraw",
    version: 2,
    elements: [rect],
    appState: { viewBackgroundColor: "#fff9db", gridSize: 20 },
    files: { img: { id: "img", dataURL: "data:image/png;base64,AA==" } },
    ...overrides,
  });
}

describe("parseScene", () => {
  it("reads the elements, the background and the embedded files", () => {
    expect(parseScene(file())).toEqual({
      elements: [rect],
      appState: { viewBackgroundColor: "#fff9db" },
      files: { img: { id: "img", dataURL: "data:image/png;base64,AA==" } },
    });
  });

  it("leaves deleted elements out", () => {
    const deleted = { ...rect, id: "b", isDeleted: true };
    expect(parseScene(file({ elements: [rect, deleted, null] }))?.elements).toEqual([rect]);
  });

  it("defaults a missing appState and files", () => {
    expect(parseScene(JSON.stringify({ type: "excalidraw", elements: [] }))).toEqual({
      elements: [],
      appState: {},
      files: {},
    });
  });

  it.each([
    ["text that is not JSON", "{not json"],
    ["JSON of another type", JSON.stringify({ type: "excalidrawlib", elements: [] })],
    ["a scene without elements", JSON.stringify({ type: "excalidraw" })],
    ["a JSON array", "[]"],
  ])("returns null for %s", (_label, text) => {
    expect(parseScene(text)).toBeNull();
  });

  it("names the reason shown for an invalid file", () => {
    expect(INVALID_EXCALIDRAW_REASON).toBe("not a valid Excalidraw file");
  });
});
