// Settings shared by the content scripts, background worker and options page.
const DEFAULT_SETTINGS = {
  enabled: true,
  // Leave empty to pick the account automatically only when there is exactly one.
  preferredEmail: "",
  // OAuth client IDs the extension is allowed to auto-approve.
  // 32555940559...           -> gcloud auth login
  // 764086051850-6qr4p6...   -> gcloud auth application-default login
  allowedClientIds: [
    "32555940559.apps.googleusercontent.com",
    "764086051850-6qr4p6gpi6hn506pt8ejuq83di341hur.apps.googleusercontent.com",
  ],
  closeSuccessTab: true,
};

async function loadSettings() {
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...stored };
}
