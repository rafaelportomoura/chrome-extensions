import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../src/settings";
import { fullyDecode, hasAllowedClient } from "../src/url";

const GCLOUD_CLIENT = "32555940559.apps.googleusercontent.com";

describe("fullyDecode", () => {
  it("decodes nested encodings", () => {
    expect(fullyDecode("a%253Db")).toBe("a=b");
  });

  it("returns the input when it is not valid percent-encoding", () => {
    expect(fullyDecode("100%")).toBe("100%");
  });
});

describe("hasAllowedClient", () => {
  it("finds an allowed client in a doubly encoded continue URL", () => {
    const inner = encodeURIComponent(`https://accounts.google.com/o?client_id=${GCLOUD_CLIENT}`);
    const url = `https://accounts.google.com/signin?continue=${encodeURIComponent(inner)}`;
    expect(hasAllowedClient(url, DEFAULT_SETTINGS.allowedClientIds)).toBe(true);
  });

  it("rejects a sign-in from another client", () => {
    const url = "https://accounts.google.com/o?client_id=123.apps.googleusercontent.com";
    expect(hasAllowedClient(url, DEFAULT_SETTINGS.allowedClientIds)).toBe(false);
  });

  it("ignores empty client IDs", () => {
    expect(hasAllowedClient("https://accounts.google.com/", [""])).toBe(false);
  });
});
