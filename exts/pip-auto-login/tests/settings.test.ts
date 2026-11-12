import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, loadSettings, parseClientIds, saveSettings } from "../src/settings";

describe("settings", () => {
  it("falls back to the defaults when nothing is stored", async () => {
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("defaults to the PIP tenant, client ID and @patria.com accounts", () => {
    expect(DEFAULT_SETTINGS).toMatchObject({
      enabled: true,
      preferredAccount: "@patria.com",
      tenantId: "60367fa4-9ea6-46cb-8d81-c9698bb7db3a",
      filterByClientId: true,
      allowedClientIds: [
        "3185aa47-2c41-4cac-9a92-f23a8f3f6c65",
        "9bfded1c-44af-4a01-b6d6-96be3634d2f9",
      ],
    });
  });

  it("returns what was saved", async () => {
    const saved = { ...DEFAULT_SETTINGS, preferredAccount: "me@example.com", enabled: false };
    await saveSettings(saved);
    expect(await loadSettings()).toEqual(saved);
  });

  it("parses one client ID per line and drops blanks", () => {
    expect(parseClientIds("  a \n\n b\n")).toEqual(["a", "b"]);
  });
});
