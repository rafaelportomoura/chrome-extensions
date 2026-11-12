// Runs on login.microsoftonline.com. Clicks through the SSO pages, but only inside an active
// flow: one PIP started, or one whose URL carries the configured tenant (and client ID).
import { log } from "./log";
import { type FlowStatus, sendMessage } from "./messages";
import { advance } from "./microsoft-page";
import { loadSettings, type Settings } from "./settings";
import { isAllowedSignIn } from "./url";

const MAX_RUNTIME_MS = 60 * 1000;
const DEBOUNCE_MS = 300;

async function isAllowedFlow(settings: Settings): Promise<boolean> {
  if (isAllowedSignIn(location.href, settings)) {
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
  if (!(await isAllowedFlow(settings))) return;
  log("allowed PIP sign-in detected");

  const ctx = {
    doc: document,
    preferredAccount: settings.preferredAccount,
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
