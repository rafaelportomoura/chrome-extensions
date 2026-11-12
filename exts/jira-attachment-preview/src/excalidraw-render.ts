// Renders one Excalidraw Preview inside the sandboxed Excalidraw page: the scene drawn to SVG by
// @excalidraw/utils, shown on a Canvas in Jira's theme.
import { mountCanvas } from "./canvas";
import { INVALID_EXCALIDRAW_REASON, parseScene, type Scene } from "./excalidraw-scene";
import { logError } from "./log";
import type { RenderMessage, Theme } from "./messages";

/** Light-theme background of a scene that sets none, as in Excalidraw. */
export const DEFAULT_BACKGROUND = "#ffffff";

/** The SVG export options the Preview uses; a subset of @excalidraw/utils' `exportScene`. */
export interface ExcalidrawExportOptions {
  type: "svg";
  data: Scene;
  config: {
    theme: Theme;
    /** In light-theme terms: the dark theme transforms it like any scene color. */
    canvasBackgroundColor: string;
    /** Fonts are loaded into the page once instead of being inlined in the SVG. */
    skipInliningFonts: true;
  };
}

/** The part of @excalidraw/utils the renderer uses; injected so tests run without it. */
export interface ExcalidrawApi {
  exportScene(options: ExcalidrawExportOptions): Promise<SVGSVGElement>;
}

/** The color the export painted behind the drawing: its first full-size `rect`. */
function exportedBackground(svg: SVGSVGElement, fallback: string): string {
  const rect = svg.querySelector(":scope > rect");
  return rect?.getAttribute("fill") ?? fallback;
}

function showError(doc: Document, text: string): void {
  const message = doc.createElement("p");
  message.className = "excalidraw-error";
  message.textContent = `Excalidraw: ${text}`;
  doc.body.replaceChildren(message);
}

export async function applyExcalidrawRender(
  doc: Document,
  message: RenderMessage,
  api: ExcalidrawApi,
): Promise<void> {
  doc.title = message.fileName;
  doc.documentElement.dataset.theme = message.theme;
  const scene = parseScene(message.content);
  if (!scene) {
    showError(doc, INVALID_EXCALIDRAW_REASON);
    return;
  }
  const background = scene.appState.viewBackgroundColor ?? DEFAULT_BACKGROUND;
  try {
    const svg = await api.exportScene({
      type: "svg",
      data: scene,
      config: { theme: message.theme, canvasBackgroundColor: background, skipInliningFonts: true },
    });
    // An empty drawing's SVG is only the export padding: nothing to fit.
    const initial = scene.elements.length === 0 ? "center" : "fit";
    mountCanvas(doc.body, svg, exportedBackground(svg, background), { initial });
  } catch (error) {
    logError("Excalidraw render failed", message.fileName, error);
    showError(doc, error instanceof Error ? error.message : String(error));
  }
}
