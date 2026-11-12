// Runs on the PIP web app for the page's whole lifetime, since the app is an SPA: a logout or
// an expired session reaches the sign-in route without a page load. Clicks
// "Sign in with Microsoft" once per flow and ends the flow when the tab is back in the app.
import { click } from "./dom";
import { log } from "./log";
import { type FlowStatus, sendMessage } from "./messages";
import { findSignInButton, isAuthPath, nextPipStep } from "./pip-page";
import { loadSettings } from "./settings";

const POLL_MS = 500;

async function isFlowActive(): Promise<boolean> {
  const { active } = await sendMessage<FlowStatus>({ type: "isFlowActive" });
  return active;
}

async function main(): Promise<void> {
  const settings = await loadSettings();
  if (!settings.enabled) return;

  const ctx = { doc: document, clicked: new WeakSet<Element>() };
  /** Since when the tab has been in the app, outside the sign-in routes, without the button. */
  let outsideSince: number | undefined;
  /** Whether this stretch outside the sign-in routes already ended the flow. */
  let finished = false;
  let busy = false;

  const tick = async (): Promise<void> => {
    const now = Date.now();
    const button = findSignInButton(ctx);
    if (button || isAuthPath(location.pathname)) {
      outsideSince = undefined;
      finished = false;
    } else {
      outsideSince ??= now;
    }

    const step = await nextPipStep({
      hasButton: button !== undefined,
      isFlowActive,
      pathname: location.pathname,
      outsideSince,
      now,
    });
    if (step === "click" && button) {
      await sendMessage({ type: "markFlow" });
      log("clicking", button.textContent?.trim());
      click(ctx, button);
    } else if (step === "blocked" && button) {
      // Never looked at again; a re-rendered button is checked afresh.
      ctx.clicked.add(button);
      log("sign-in page is back while a flow is active; leaving it to the user");
    } else if (step === "finished" && !finished) {
      finished = true;
      if (await isFlowActive()) log("back in PIP, flow finished");
      await sendMessage({ type: "flowFinished" });
    }
  };

  setInterval(() => {
    if (busy) return;
    busy = true;
    void tick().finally(() => {
      busy = false;
    });
  }, POLL_MS);
}

void main();
