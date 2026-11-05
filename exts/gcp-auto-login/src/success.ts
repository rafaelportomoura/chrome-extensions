// Runs on the success page that gcloud redirects to.
import { sendMessage } from "./messages";
import { loadSettings } from "./settings";

const CLOSE_DELAY_MS = 1500;

async function main(): Promise<void> {
  const settings = await loadSettings();
  if (!settings.enabled) return;
  setTimeout(() => {
    void sendMessage({ type: "flowFinished", closeTab: settings.closeSuccessTab });
  }, CLOSE_DELAY_MS);
}

void main();
