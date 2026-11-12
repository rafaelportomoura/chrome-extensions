// Renders one Preview sent by the parent of the sandbox page: an HTML file replaces the page;
// Markdown is rendered into it. The listener is shared with the Excalidraw page.
import { type MermaidApi, markdownToSafeHtml, renderMermaidBlocks } from "./markdown";
import { isRenderMessage, READY_TYPE, type RenderMessage } from "./messages";

export async function applyRender(
  doc: Document,
  message: RenderMessage,
  mermaidApi: MermaidApi,
): Promise<void> {
  if (message.kind === "html") {
    doc.open();
    doc.write(message.content);
    doc.close();
    return;
  }
  doc.title = message.fileName;
  doc.documentElement.dataset.theme = message.theme;
  const article = doc.createElement("article");
  article.className = "markdown-body";
  article.innerHTML = markdownToSafeHtml(message.content);
  doc.body.replaceChildren(article);
  await renderMermaidBlocks(article, message.theme, mermaidApi);
}

/** Waits for the parent's single render message, then hands it to `render`. */
export function listenForRender(
  win: Window,
  render: (doc: Document, message: RenderMessage) => Promise<void>,
): void {
  const onMessage = (event: MessageEvent): void => {
    if (event.source !== win.parent || !isRenderMessage(event.data)) return;
    win.removeEventListener("message", onMessage);
    void render(win.document, event.data);
  };
  win.addEventListener("message", onMessage);
  win.parent.postMessage({ type: READY_TYPE }, "*");
}
