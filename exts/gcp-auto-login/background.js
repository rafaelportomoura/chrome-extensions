// Tracks which tabs are inside an allowed gcloud OAuth flow. Google moves the
// user through several accounts.google.com pages and not all of them carry the
// client_id in the URL, so the first page that does marks the whole tab.
const FLOW_TTL_MS = 5 * 60 * 1000;

const flowKey = (tabId) => `flow:${tabId}`;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;
  if (tabId === undefined) return false;

  if (message.type === "markFlow") {
    chrome.storage.session
      .set({ [flowKey(tabId)]: Date.now() })
      .then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === "isFlowActive") {
    chrome.storage.session.get(flowKey(tabId)).then((data) => {
      const startedAt = data[flowKey(tabId)];
      sendResponse({ active: Boolean(startedAt) && Date.now() - startedAt < FLOW_TTL_MS });
    });
    return true;
  }

  if (message.type === "flowFinished") {
    chrome.storage.session.remove(flowKey(tabId)).then(() => {
      if (message.closeTab) chrome.tabs.remove(tabId);
      sendResponse({ ok: true });
    });
    return true;
  }

  return false;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.session.remove(flowKey(tabId));
});
