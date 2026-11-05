const $ = (id) => document.getElementById(id);

(async () => {
  const settings = await loadSettings();
  $("enabled").checked = settings.enabled;
  $("closeSuccessTab").checked = settings.closeSuccessTab;
  $("preferredEmail").value = settings.preferredEmail;
  $("allowedClientIds").value = settings.allowedClientIds.join("\n");
})();

$("save").addEventListener("click", async () => {
  await chrome.storage.sync.set({
    enabled: $("enabled").checked,
    closeSuccessTab: $("closeSuccessTab").checked,
    preferredEmail: $("preferredEmail").value.trim(),
    allowedClientIds: $("allowedClientIds")
      .value.split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  });
  $("status").textContent = "Saved";
  setTimeout(() => ($("status").textContent = ""), 1500);
});
