// Snapshots handed from a Jira page to the new-tab page through chrome.storage.session, which
// content scripts cannot reach and which is cleared when the browser closes.
import type { PreviewPayload } from "./messages";

const KEY_PREFIX = "snapshot:";

/** Stores the snapshot and opens the new-tab page on it. Runs in the background worker. */
export async function openSnapshotTab(snapshot: PreviewPayload): Promise<void> {
  const id = crypto.randomUUID();
  await chrome.storage.session.set({ [`${KEY_PREFIX}${id}`]: snapshot });
  await chrome.tabs.create({ url: chrome.runtime.getURL(`tab.html?id=${id}`) });
}

/** The stored snapshot, or null when it is gone (browser restarted) or the id is unknown. */
export async function loadSnapshot(id: string | null): Promise<PreviewPayload | null> {
  if (!id) return null;
  const key = `${KEY_PREFIX}${id}`;
  const stored = await chrome.storage.session.get(key);
  return (stored[key] as PreviewPayload | undefined) ?? null;
}
