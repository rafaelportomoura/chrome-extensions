import { loadSettings, parseClientIds, saveSettings } from "./settings";

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id} on the options page`);
  return el as T;
}

const enabled = byId<HTMLInputElement>("enabled");
const preferredAccount = byId<HTMLInputElement>("preferredAccount");
const tenantId = byId<HTMLInputElement>("tenantId");
const filterByClientId = byId<HTMLInputElement>("filterByClientId");
const allowedClientIds = byId<HTMLTextAreaElement>("allowedClientIds");
const status = byId<HTMLSpanElement>("status");

function syncClientIdsField(): void {
  allowedClientIds.disabled = !filterByClientId.checked;
}

void loadSettings().then((settings) => {
  enabled.checked = settings.enabled;
  preferredAccount.value = settings.preferredAccount;
  tenantId.value = settings.tenantId;
  filterByClientId.checked = settings.filterByClientId;
  allowedClientIds.value = settings.allowedClientIds.join("\n");
  syncClientIdsField();
});

filterByClientId.addEventListener("change", syncClientIdsField);

byId<HTMLButtonElement>("save").addEventListener("click", async () => {
  await saveSettings({
    enabled: enabled.checked,
    preferredAccount: preferredAccount.value.trim(),
    tenantId: tenantId.value.trim(),
    filterByClientId: filterByClientId.checked,
    allowedClientIds: parseClientIds(allowedClientIds.value),
  });
  status.textContent = "Saved";
  setTimeout(() => {
    status.textContent = "";
  }, 1500);
});
