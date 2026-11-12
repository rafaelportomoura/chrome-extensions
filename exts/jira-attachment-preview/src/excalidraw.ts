// Excalidraw sandbox page entry (opaque origin, no chrome.* APIs): draws the scene its parent sends.
import { exportScene } from "@excalidraw/utils";
import { applyExcalidrawRender } from "./excalidraw-render";
import { listenForRender } from "./preview-render";

listenForRender(window, (doc, message) =>
  applyExcalidrawRender(doc, message, {
    exportScene: (options) => exportScene(options),
  }),
);
