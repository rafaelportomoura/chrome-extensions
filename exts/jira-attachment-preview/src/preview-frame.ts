// Frames the sandboxed preview page and hands it the Preview to show.
import { isReadyMessage, type PreviewPayload, RENDER_TYPE, type RenderMessage } from "./messages";

/** Frames preview.html in `container` and renders `payload` once the frame is ready. */
export function framePreview(
  container: HTMLElement,
  payload: PreviewPayload,
  previewUrl: string,
): HTMLIFrameElement {
  const doc = container.ownerDocument;
  const frame = doc.createElement("iframe");
  frame.src = previewUrl;
  frame.setAttribute("sandbox", "allow-scripts");
  frame.title = `Preview of ${payload.fileName}`;
  frame.style.cssText = "border:0;width:100%;height:100%;display:block;background:#fff";
  const onMessage = (event: MessageEvent): void => {
    if (event.source !== frame.contentWindow || !isReadyMessage(event.data)) return;
    doc.defaultView?.removeEventListener("message", onMessage);
    const message: RenderMessage = { type: RENDER_TYPE, ...payload };
    // The frame has an opaque origin, so "*" is the only target that reaches it.
    frame.contentWindow?.postMessage(message, "*");
  };
  doc.defaultView?.addEventListener("message", onMessage);
  container.append(frame);
  return frame;
}
