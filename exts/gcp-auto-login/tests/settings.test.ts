import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, loadSettings, parseClientIds, saveSettings } from "../src/settings";

describe("settings", () => {
  it("falls back to the defaults when nothing is stored", async () => {
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("returns what was saved", async () => {
    const saved = { ...DEFAULT_SETTINGS, preferredEmail: "me@example.com", enabled: false };
    await saveSettings(saved);
    expect(await loadSettings()).toEqual(saved);
  });

  it("parses one client ID per line and drops blanks", () => {
    expect(parseClientIds("  a.apps \n\n b.apps\n")).toEqual(["a.apps", "b.apps"]);
  });
});
