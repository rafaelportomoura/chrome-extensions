// Background worker: opens the new-tab Preview for the content script.
import { log } from "./log";
import { OPEN_TAB_TYPE, type OpenTabMessage } from "./messages";
import { openSnapshotTab } from "./snapshot";

chrome.runtime.onMessage.addListener((message: OpenTabMessage) => {
  if (message?.type !== OPEN_TAB_TYPE) return false;
  openSnapshotTab(message.snapshot).catch((error: unknown) => log("open tab failed", error));
  return false;
});
