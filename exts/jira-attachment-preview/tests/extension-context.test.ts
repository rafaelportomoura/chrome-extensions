import { describe, expect, it } from "vitest";
import { EXTENSION_RELOADED_REASON, extensionRuntime } from "../src/extension-context";
import { PreviewError } from "../src/preview-error";

describe("extensionRuntime", () => {
  it("returns the runtime while the extension is connected", () => {
    const runtime = { id: "abc" } as typeof chrome.runtime;
    expect(extensionRuntime({ runtime } as typeof chrome)).toBe(runtime);
  });

  it("explains that the page must be reloaded once the extension context is gone", () => {
    for (const api of [{}, { runtime: {} }]) {
      const call = () => extensionRuntime(api as typeof chrome);
      expect(call).toThrow(PreviewError);
      expect(call).toThrow(EXTENSION_RELOADED_REASON);
    }
  });
});
