import { forgetTab, handleMessage } from "./flow-tracker";
import type { Message } from "./messages";

chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  const tabId = sender.tab?.id;
  if (tabId === undefined) return false;
  void handleMessage(message, tabId).then(sendResponse);
  return true;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void forgetTab(tabId);
});
