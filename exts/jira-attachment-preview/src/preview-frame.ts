// Frames the sandboxed preview page and hands it the Preview to show.
import { log } from "./log";
import { isReadyMessage, type PreviewPayload, RENDER_TYPE, type RenderMessage } from "./messages";

/**
 * Frames preview.html in `container` and renders `payload` each time the frame reports it is ready,
 * then calls `onReady`. A frame that reloads (Chrome can reload one when its tab comes back to the
 * foreground) reports ready again and gets the payload again, instead of staying blank. The
 * listener goes away once the frame leaves the page.
 */
export function framePreview(
  container: HTMLElement,
  payload: PreviewPayload,
  previewUrl: string,
  onReady?: () => void,
): HTMLIFrameElement {
  const doc = container.ownerDocument;
  const frame = doc.createElement("iframe");
  frame.src = previewUrl;
  frame.setAttribute("sandbox", "allow-scripts");
  frame.title = `Preview of ${payload.fileName}`;
  frame.style.cssText = "border:0;width:100%;height:100%;display:block;background:#fff";
  let renders = 0;
  const onMessage = (event: MessageEvent): void => {
    if (!frame.isConnected) {
      doc.defaultView?.removeEventListener("message", onMessage);
      log("preview frame removed; stopped listening", payload.fileName);
      return;
    }
    if (event.source !== frame.contentWindow || !isReadyMessage(event.data)) return;
    renders++;
    log(
      renders === 1
        ? "preview frame ready; sending the content"
        : "preview frame ready again (it reloaded); sending the content again",
      payload.fileName,
    );
    const message: RenderMessage = { type: RENDER_TYPE, ...payload };
    // The frame has an opaque origin, so "*" is the only target that reaches it.
    frame.contentWindow?.postMessage(message, "*");
    onReady?.();
  };
  doc.defaultView?.addEventListener("message", onMessage);
  container.append(frame);
  return frame;
}
