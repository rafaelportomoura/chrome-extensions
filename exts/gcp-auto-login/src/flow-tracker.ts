// Tracks which tabs are inside an active flow. Google moves the user through several
// accounts.google.com pages and not all of them carry the client ID in the URL, so the
// first page that does marks the whole tab.
import type { FlowStatus, Message } from "./messages";

export const FLOW_TTL_MS = 5 * 60 * 1000;

export const flowKey = (tabId: number): string => `flow:${tabId}`;

export function isFlowActive(startedAt: number | undefined, now: number): boolean {
  return startedAt !== undefined && now - startedAt < FLOW_TTL_MS;
}

export async function handleMessage(
  message: Message,
  tabId: number,
): Promise<FlowStatus | { ok: true }> {
  const key = flowKey(tabId);
  switch (message.type) {
    case "markFlow":
      await chrome.storage.session.set({ [key]: Date.now() });
      return { ok: true };
    case "isFlowActive": {
      const data = await chrome.storage.session.get(key);
      return { active: isFlowActive(data[key] as number | undefined, Date.now()) };
    }
    case "flowFinished":
      await chrome.storage.session.remove(key);
      if (message.closeTab) void chrome.tabs.remove(tabId);
      return { ok: true };
  }
}

export async function forgetTab(tabId: number): Promise<void> {
  await chrome.storage.session.remove(flowKey(tabId));
}
