// Reads the full text of the attachment viewer's code editor. Jira's CodeMirror 6 editor keeps
// the whole file in memory but draws only the visible lines, and its state is reachable only from
// the page world. A MAIN-world script answers requests sent from the isolated content script
// through window.postMessage, which carries data between the two worlds (CustomEvent details
// do not reliably cross them).

import { VIEWER_SELECTOR } from "./viewer";

export const REQUEST_TYPE = "jira-attachment-preview:editor-request";
export const RESPONSE_TYPE = "jira-attachment-preview:editor-response";

const EDITOR_SELECTOR = `${VIEWER_SELECTOR} .cm-content`;

/** How long the page world waits for the editor to appear before answering "no editor". */
export const EDITOR_WAIT_MS = 1500;
/** How long the content script waits for an answer. */
export const RESPONSE_TIMEOUT_MS = 2500;
const POLL_MS = 100;

interface EditorElement extends Element {
  cmView?: {
    view?: { state?: { doc?: { toString(): string } } };
    rootView?: { view?: { state?: { doc?: { toString(): string } } } };
  };
}

/** The editor's full text, or null when no editor with a readable state is in the viewer. */
export function readEditorText(doc: Document): string | null {
  const element = doc.querySelector<EditorElement>(EDITOR_SELECTOR);
  const view = element?.cmView?.view ?? element?.cmView?.rootView?.view;
  const text = view?.state?.doc?.toString();
  return typeof text === "string" ? text : null;
}

async function waitForEditorText(doc: Document, waitMs: number): Promise<string | null> {
  const deadline = Date.now() + waitMs;
  for (;;) {
    const text = readEditorText(doc);
    if (text !== null || Date.now() >= deadline) return text;
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
}

interface BridgeMessage {
  type: typeof REQUEST_TYPE | typeof RESPONSE_TYPE;
  requestId: string;
  text?: string | null;
}

function bridgeMessage(event: MessageEvent, win: Window, type: string): BridgeMessage | null {
  if (event.source !== win || typeof event.data !== "object" || event.data === null) return null;
  const data = event.data as Partial<BridgeMessage>;
  return data.type === type && typeof data.requestId === "string" ? (data as BridgeMessage) : null;
}

/** Page world: answers every request with the editor text. */
export function installEditorResponder(win: Window, waitMs = EDITOR_WAIT_MS): void {
  win.addEventListener("message", (event) => {
    const request = bridgeMessage(event, win, REQUEST_TYPE);
    if (!request) return;
    void waitForEditorText(win.document, waitMs).then((text) => {
      const response: BridgeMessage = { type: RESPONSE_TYPE, requestId: request.requestId, text };
      win.postMessage(response, win.location.origin);
    });
  });
}

/** Content script: asks the page world for the editor text; null on "no editor" or timeout. */
export function requestEditorText(
  win: Window,
  timeoutMs = RESPONSE_TIMEOUT_MS,
): Promise<string | null> {
  const requestId = crypto.randomUUID();
  return new Promise((resolve) => {
    const finish = (text: string | null): void => {
      clearTimeout(timer);
      win.removeEventListener("message", onMessage);
      resolve(text);
    };
    const onMessage = (event: MessageEvent): void => {
      const response = bridgeMessage(event, win, RESPONSE_TYPE);
      if (response?.requestId !== requestId) return;
      finish(typeof response.text === "string" ? response.text : null);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    win.addEventListener("message", onMessage);
    const request: BridgeMessage = { type: REQUEST_TYPE, requestId };
    win.postMessage(request, win.location.origin);
  });
}
