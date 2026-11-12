// Messages between the extension's pages and scripts.
import { isPreviewKind, type PreviewKind } from "./file-type";

export type Theme = "light" | "dark";

export const READY_TYPE = "jira-attachment-preview:ready";
export const RENDER_TYPE = "jira-attachment-preview:render";
export const OPEN_TAB_TYPE = "jira-attachment-preview:open-tab";

/** What a Preview needs; also the snapshot handed to the new-tab page. */
export interface PreviewPayload {
  fileName: string;
  kind: PreviewKind;
  content: string;
  theme: Theme;
}

/** Sent by a sandbox page (preview.html, excalidraw.html) to its parent once it can render. */
export interface ReadyMessage {
  type: typeof READY_TYPE;
}

/** Sent to a sandbox page: render this payload. */
export interface RenderMessage extends PreviewPayload {
  type: typeof RENDER_TYPE;
}

/** Sent by the content script to the background worker. */
export interface OpenTabMessage {
  type: typeof OPEN_TAB_TYPE;
  snapshot: PreviewPayload;
}

export function isRenderMessage(data: unknown): data is RenderMessage {
  if (typeof data !== "object" || data === null) return false;
  const message = data as Partial<RenderMessage>;
  return (
    message.type === RENDER_TYPE &&
    isPreviewKind(message.kind) &&
    typeof message.content === "string" &&
    (message.theme === "light" || message.theme === "dark")
  );
}

export function isReadyMessage(data: unknown): data is ReadyMessage {
  return typeof data === "object" && data !== null && (data as ReadyMessage).type === READY_TYPE;
}
