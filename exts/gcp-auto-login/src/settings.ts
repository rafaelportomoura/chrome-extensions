export interface Settings {
  enabled: boolean;
  /** Empty: pick the account automatically only when the chooser shows a single one. */
  preferredEmail: string;
  /** OAuth client IDs whose gcloud sign-in the extension may complete. */
  allowedClientIds: string[];
  closeSuccessTab: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  preferredEmail: "",
  allowedClientIds: [
    // gcloud auth login
    "32555940559.apps.googleusercontent.com",
    // gcloud auth application-default login
    "764086051850-6qr4p6gpi6hn506pt8ejuq83di341hur.apps.googleusercontent.com",
  ],
  closeSuccessTab: true,
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
