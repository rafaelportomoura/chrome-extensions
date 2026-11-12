// Sandbox page entry (opaque origin, no chrome.* APIs): renders the Preview its parent sends.
import mermaid from "mermaid";
import { applyRender, listenForRender } from "./preview-render";

listenForRender(window, (doc, message) => applyRender(doc, message, mermaid));
