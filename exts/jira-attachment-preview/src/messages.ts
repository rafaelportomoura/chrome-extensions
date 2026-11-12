// Messages between the extension's pages and scripts.
import type { PreviewKind } from "./file-type";
import type { Theme } from "./markdown";

/** What a Preview needs; also the snapshot handed to the new-tab page. */
export interface PreviewPayload {
  fileName: string;
  kind: PreviewKind;
  content: string;
  theme: Theme;
}

/** Sent by preview.html to its parent once it can render. */
export interface ReadyMessage {
  type: "jira-attachment-preview:ready";
}

/** Sent to preview.html: render this payload. */
export interface RenderMessage extends PreviewPayload {
  type: "jira-attachment-preview:render";
}

/** Sent by the content script to the background worker. */
export interface OpenTabMessage {
  type: "openTab";
  snapshot: PreviewPayload;
}

export const READY_TYPE = "jira-attachment-preview:ready";
export const RENDER_TYPE = "jira-attachment-preview:render";

export function isRenderMessage(data: unknown): data is RenderMessage {
  if (typeof data !== "object" || data === null) return false;
  const message = data as Partial<RenderMessage>;
  return (
    message.type === RENDER_TYPE &&
    (message.kind === "html" || message.kind === "markdown") &&
    typeof message.content === "string" &&
    (message.theme === "light" || message.theme === "dark")
  );
}

export function isReadyMessage(data: unknown): data is ReadyMessage {
  return typeof data === "object" && data !== null && (data as ReadyMessage).type === READY_TYPE;
}

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
