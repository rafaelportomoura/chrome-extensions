// Runs on the PIP web app. Clicks "Sign in with Microsoft" once per flow and ends the flow
// when the tab is back in the app.
import { click } from "./dom";
import { log } from "./log";
import { type FlowStatus, sendMessage } from "./messages";
import { findSignInButton, isAuthPath, nextPipStep } from "./pip-page";
import { loadSettings } from "./settings";

const MAX_RUNTIME_MS = 60 * 1000;
const POLL_MS = 500;

async function isFlowActive(): Promise<boolean> {
  const { active } = await sendMessage<FlowStatus>({ type: "isFlowActive" });
  return active;
}

async function main(): Promise<void> {
  const settings = await loadSettings();
  if (!settings.enabled) return;

  const ctx = { doc: document, clicked: new WeakSet<Element>() };
  const startedAt = Date.now();
  let outsideSince: number | undefined;
  let busy = false;
  let timer: ReturnType<typeof setInterval> | undefined;
  const stop = (): void => clearInterval(timer);

  const tick = async (): Promise<void> => {
    const now = Date.now();
    if (now - startedAt > MAX_RUNTIME_MS) return stop();
    const button = findSignInButton(ctx);
    if (button || isAuthPath(location.pathname)) outsideSince = undefined;
    else outsideSince ??= now;

    const step = await nextPipStep({
      hasButton: button !== undefined,
      isFlowActive,
      pathname: location.pathname,
      outsideSince,
      now,
    });
    switch (step) {
      case "click":
        if (!button) return;
        stop();
        await sendMessage({ type: "markFlow" });
        log("clicking", button.textContent?.trim());
        click(ctx, button);
        return;
      case "blocked":
        stop();
        log("sign-in page is back while a flow is active; leaving it to the user");
        return;
      case "finished":
        stop();
        if (await isFlowActive()) log("back in PIP, flow finished");
        await sendMessage({ type: "flowFinished" });
        return;
      case "wait":
        return;
    }
  };

  timer = setInterval(() => {
    if (busy) return;
    busy = true;
    void tick().finally(() => {
      busy = false;
    });
  }, POLL_MS);
}

void main();
