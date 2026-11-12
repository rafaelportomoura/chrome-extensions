import { describe, expect, it, vi } from "vitest";
import { applyExcalidrawRender, type ExcalidrawApi } from "../src/excalidraw-render";
import { RENDER_TYPE, type RenderMessage } from "../src/messages";

const SVG_NS = "http://www.w3.org/2000/svg";
const rect = { id: "a", type: "rectangle", x: 0, y: 0, width: 10, height: 10 };

function scene(appState: Record<string, unknown> = {}): string {
  return JSON.stringify({
    type: "excalidraw",
    elements: [rect, { ...rect, id: "gone", isDeleted: true }],
    appState,
    files: { img: { id: "img", dataURL: "data:image/png;base64,AA==" } },
  });
}

function message(overrides: Partial<RenderMessage> = {}): RenderMessage {
  return {
    type: RENDER_TYPE,
    fileName: "flow.excalidraw",
    kind: "excalidraw",
    content: scene({ viewBackgroundColor: "#fff9db" }),
    theme: "light",
    ...overrides,
  };
}

/** An export that paints `fill` as its background rect, like @excalidraw/utils. */
function api(fill = "#fff9db"): ExcalidrawApi {
  return {
    exportScene: vi.fn(async () => {
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("width", "100");
      svg.setAttribute("height", "50");
      const background = document.createElementNS(SVG_NS, "rect");
      background.setAttribute("fill", fill);
      svg.append(background);
      return svg;
    }),
  };
}

describe("applyExcalidrawRender", () => {
  it("draws the scene's live elements and files on a Canvas", async () => {
    const excalidraw = api();
    await applyExcalidrawRender(document, message(), excalidraw);
    expect(excalidraw.exportScene).toHaveBeenCalledWith({
      type: "svg",
      data: {
        elements: [rect],
        appState: { viewBackgroundColor: "#fff9db" },
        files: { img: { id: "img", dataURL: "data:image/png;base64,AA==" } },
      },
      config: { theme: "light", canvasBackgroundColor: "#fff9db", skipInliningFonts: true },
    });
    expect(document.querySelector(".canvas svg")).not.toBeNull();
    expect(document.title).toBe("flow.excalidraw");
  });

  it("uses white when the scene sets no background", async () => {
    const excalidraw = api("#ffffff");
    await applyExcalidrawRender(document, message({ content: scene() }), excalidraw);
    expect(vi.mocked(excalidraw.exportScene).mock.calls[0]?.[0].config.canvasBackgroundColor).toBe(
      "#ffffff",
    );
  });

  it("draws in Excalidraw's dark theme and paints the Canvas with the exported background", async () => {
    const excalidraw = api("#1e1900");
    await applyExcalidrawRender(document, message({ theme: "dark" }), excalidraw);
    expect(vi.mocked(excalidraw.exportScene).mock.calls[0]?.[0].config.theme).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.querySelector<HTMLElement>(".canvas")?.style.background).toBe("rgb(30, 25, 0)");
  });

  it("shows and logs an error the export throws", async () => {
    const excalidraw: ExcalidrawApi = {
      exportScene: vi.fn(async () => {
        throw new Error("bad element");
      }),
    };
    await applyExcalidrawRender(document, message(), excalidraw);
    expect(document.querySelector(".excalidraw-error")?.textContent).toBe(
      "Excalidraw: bad element",
    );
    expect(console.error).toHaveBeenCalledWith(
      "[jira-attachment-preview]",
      "Excalidraw render failed",
      "flow.excalidraw",
      expect.any(Error),
    );
  });

  it("says so when the content is not a scene", async () => {
    const excalidraw = api();
    await applyExcalidrawRender(document, message({ content: "{}" }), excalidraw);
    expect(excalidraw.exportScene).not.toHaveBeenCalled();
    expect(document.querySelector(".excalidraw-error")?.textContent).toBe(
      "Excalidraw: not a valid Excalidraw file",
    );
  });
});
