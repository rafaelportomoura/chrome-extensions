import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../src/settings";
import { fullyDecode, isAllowedSignIn } from "../src/url";

const TENANT = DEFAULT_SETTINGS.tenantId;
const CLIENT = "3185aa47-2c41-4cac-9a92-f23a8f3f6c65";
const authorize = (tenant: string, client: string) =>
  `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?client_id=${client}` +
  "&scope=openid%20profile&redirect_uri=https%3A%2F%2Fweb.dev-pip.internal";

describe("fullyDecode", () => {
  it("decodes nested encodings", () => {
    expect(fullyDecode("a%253Db")).toBe("a=b");
  });

  it("returns the input when it is not valid percent-encoding", () => {
    expect(fullyDecode("100%")).toBe("100%");
  });
});

describe("isAllowedSignIn", () => {
  it("accepts the PIP authorize URL", () => {
    expect(isAllowedSignIn(authorize(TENANT, CLIENT), DEFAULT_SETTINGS)).toBe(true);
  });

  it("ignores case in the tenant and client ID", () => {
    const url = authorize(TENANT.toUpperCase(), CLIENT.toUpperCase());
    expect(isAllowedSignIn(url, DEFAULT_SETTINGS)).toBe(true);
  });

  it("rejects another tenant", () => {
    const url = authorize("00000000-0000-0000-0000-000000000000", CLIENT);
    expect(isAllowedSignIn(url, DEFAULT_SETTINGS)).toBe(false);
  });

  it("rejects another client ID while the filter is on", () => {
    const url = authorize(TENANT, "11111111-1111-1111-1111-111111111111");
    expect(isAllowedSignIn(url, DEFAULT_SETTINGS)).toBe(false);
  });

  it("accepts any client ID of the tenant while the filter is off", () => {
    const url = authorize(TENANT, "11111111-1111-1111-1111-111111111111");
    expect(isAllowedSignIn(url, { ...DEFAULT_SETTINGS, filterByClientId: false })).toBe(true);
  });

  it("rejects everything when the tenant is empty", () => {
    const url = authorize(TENANT, CLIENT);
    expect(isAllowedSignIn(url, { ...DEFAULT_SETTINGS, tenantId: " " })).toBe(false);
  });

  it("ignores empty client IDs", () => {
    const url = authorize(TENANT, "");
    expect(isAllowedSignIn(url, { ...DEFAULT_SETTINGS, allowedClientIds: [""] })).toBe(false);
  });
});
