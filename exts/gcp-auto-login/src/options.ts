import { loadSettings, parseClientIds, saveSettings } from "./settings";

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id} on the options page`);
  return el as T;
}

const enabled = byId<HTMLInputElement>("enabled");
const closeSuccessTab = byId<HTMLInputElement>("closeSuccessTab");
const preferredEmail = byId<HTMLInputElement>("preferredEmail");
const allowedClientIds = byId<HTMLTextAreaElement>("allowedClientIds");
const status = byId<HTMLSpanElement>("status");

void loadSettings().then((settings) => {
  enabled.checked = settings.enabled;
  closeSuccessTab.checked = settings.closeSuccessTab;
  preferredEmail.value = settings.preferredEmail;
  allowedClientIds.value = settings.allowedClientIds.join("\n");
});

byId<HTMLButtonElement>("save").addEventListener("click", async () => {
  await saveSettings({
    enabled: enabled.checked,
    closeSuccessTab: closeSuccessTab.checked,
    preferredEmail: preferredEmail.value.trim(),
    allowedClientIds: parseClientIds(allowedClientIds.value),
  });
  status.textContent = "Saved";
  setTimeout(() => {
    status.textContent = "";
  }, 1500);
});
