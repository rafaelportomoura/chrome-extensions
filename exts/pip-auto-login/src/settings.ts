export interface Settings {
  enabled: boolean;
  /**
   * An email, or an `@domain` that exactly one chooser account must match. Empty: pick the
   * account automatically only when the chooser shows a single one.
   */
  preferredAccount: string;
  /** Microsoft Entra ID tenant whose sign-in the extension may complete. */
  tenantId: string;
  /** On: the sign-in must also carry one of `allowedClientIds`. Off: the tenant is enough. */
  filterByClientId: boolean;
  /** OAuth client IDs whose sign-in the extension may complete. */
  allowedClientIds: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  preferredAccount: "@patria.com",
  tenantId: "60367fa4-9ea6-46cb-8d81-c9698bb7db3a",
  filterByClientId: true,
  allowedClientIds: [
    // PIP web app, dev
    "3185aa47-2c41-4cac-9a92-f23a8f3f6c65",
    // PIP web app, UAT
    "9bfded1c-44af-4a01-b6d6-96be3634d2f9",
  ],
};

export async function loadSettings(): Promise<Settings> {
  const stored = (await chrome.storage.sync.get(DEFAULT_SETTINGS)) as Partial<Settings>;
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.sync.set(settings);
}

/** Parses the options page textarea: one client ID per line, blanks dropped. */
export function parseClientIds(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
