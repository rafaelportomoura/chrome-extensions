// Background worker: opens the new-tab Preview for the content script.
import { log } from "./log";
import type { OpenTabMessage } from "./messages";
import { openSnapshotTab } from "./snapshot";

chrome.runtime.onMessage.addListener((message: OpenTabMessage) => {
  if (message?.type !== "openTab") return false;
  openSnapshotTab(message.snapshot).catch((error: unknown) => log("open tab failed", error));
  return false;
});
