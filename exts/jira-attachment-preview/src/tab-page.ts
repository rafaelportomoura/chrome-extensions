// The new-tab page: shows a stored snapshot in the same sandboxed preview page as the viewer.
import { framePreview } from "./messages";
import { loadSnapshot } from "./snapshot";

export const EXPIRED_TEXT = "Preview expired — open it again from Jira";

export async function showSnapshot(doc: Document, search: string): Promise<void> {
  const snapshot = await loadSnapshot(new URLSearchParams(search).get("id"));
  const main = doc.querySelector<HTMLElement>("main") ?? doc.body;
  if (!snapshot) {
    const message = doc.createElement("p");
    message.className = "expired";
    message.textContent = EXPIRED_TEXT;
    main.replaceChildren(message);
    return;
  }
  doc.title = snapshot.fileName;
  framePreview(main, snapshot, chrome.runtime.getURL("preview.html"));
}
