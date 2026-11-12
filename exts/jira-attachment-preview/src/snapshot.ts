// Snapshots handed from a Jira page to the new-tab page through chrome.storage.session, which
// content scripts cannot reach and which is cleared when the browser closes.
import type { PreviewPayload } from "./messages";

const KEY_PREFIX = "snapshot:";

/** Removes every stored snapshot; earlier new-tab pages then show the expired message. */
async function clearSnapshots(): Promise<void> {
  const stored = await chrome.storage.session.get(null);
  const keys = Object.keys(stored).filter((key) => key.startsWith(KEY_PREFIX));
  if (keys.length > 0) await chrome.storage.session.remove(keys);
}

/**
 * Stores the snapshot and opens the new-tab page on it. Runs in the background worker. Session
 * storage holds about 10 MB, so when it is full the older snapshots make room for the new one.
 */
export async function openSnapshotTab(snapshot: PreviewPayload): Promise<void> {
  const id = crypto.randomUUID();
  const item = { [`${KEY_PREFIX}${id}`]: snapshot };
  try {
    await chrome.storage.session.set(item);
  } catch {
    await clearSnapshots();
    await chrome.storage.session.set(item);
  }
  await chrome.tabs.create({ url: chrome.runtime.getURL(`tab.html?id=${id}`) });
}

/** The stored snapshot, or null when it is gone (browser restarted) or the id is unknown. */
export async function loadSnapshot(id: string | null): Promise<PreviewPayload | null> {
  if (!id) return null;
  const key = `${KEY_PREFIX}${id}`;
  const stored = await chrome.storage.session.get(key);
  return (stored[key] as PreviewPayload | undefined) ?? null;
}
