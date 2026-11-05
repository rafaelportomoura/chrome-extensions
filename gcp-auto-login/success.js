// Runs on the "You are now authenticated" page gcloud redirects to.
(async () => {
  const settings = await loadSettings();
  if (!settings.enabled) return;
  setTimeout(() => {
    chrome.runtime.sendMessage({ type: "flowFinished", closeTab: settings.closeSuccessTab });
  }, 1500);
})();
