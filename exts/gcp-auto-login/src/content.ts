// Runs on accounts.google.com. Clicks through the sign-in pages, but only inside an
// active flow started by an allowed client.
import { log } from "./log";
import { type FlowStatus, sendMessage } from "./messages";
import { loadSettings } from "./settings";
import { advance } from "./sign-in-page";
import { hasAllowedClient } from "./url";

const MAX_RUNTIME_MS = 60 * 1000;
const DEBOUNCE_MS = 300;

async function isAllowedFlow(allowedClientIds: string[]): Promise<boolean> {
  if (hasAllowedClient(location.href, allowedClientIds)) {
    await sendMessage({ type: "markFlow" });
    return true;
  }
  const { active } = await sendMessage<FlowStatus>({ type: "isFlowActive" });
  return active;
}

function debounce(fn: () => void, waitMs: number): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(fn, waitMs);
  };
}

async function main(): Promise<void> {
  const settings = await loadSettings();
  if (!settings.enabled) return;
  if (!(await isAllowedFlow(settings.allowedClientIds))) return;
  log("allowed gcloud OAuth flow detected");

  const ctx = {
    doc: document,
    preferredEmail: settings.preferredEmail,
    clicked: new WeakSet<Element>(),
  };
  const startedAt = Date.now();

  const tick = (): void => {
    if (Date.now() - startedAt > MAX_RUNTIME_MS) {
      observer.disconnect();
      return;
    }
    advance(ctx);
  };

  const observer = new MutationObserver(debounce(tick, DEBOUNCE_MS));
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
  tick();
}

void main();
