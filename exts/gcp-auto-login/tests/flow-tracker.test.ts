import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FLOW_TTL_MS, forgetTab, handleMessage, isFlowActive } from "../src/flow-tracker";

const TAB = 7;

describe("isFlowActive", () => {
  it("is active within the TTL and inactive after it", () => {
    expect(isFlowActive(1000, 1000 + FLOW_TTL_MS - 1)).toBe(true);
    expect(isFlowActive(1000, 1000 + FLOW_TTL_MS)).toBe(false);
    expect(isFlowActive(undefined, 1000)).toBe(false);
  });
});

describe("handleMessage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps a marked tab active until the TTL expires", async () => {
    await handleMessage({ type: "markFlow" }, TAB);
    expect(await handleMessage({ type: "isFlowActive" }, TAB)).toEqual({ active: true });
    expect(await handleMessage({ type: "isFlowActive" }, TAB + 1)).toEqual({ active: false });

    vi.advanceTimersByTime(FLOW_TTL_MS);
    expect(await handleMessage({ type: "isFlowActive" }, TAB)).toEqual({ active: false });
  });

  it("ends the flow and closes the tab when asked", async () => {
    await handleMessage({ type: "markFlow" }, TAB);
    await handleMessage({ type: "flowFinished", closeTab: true }, TAB);

    expect(await handleMessage({ type: "isFlowActive" }, TAB)).toEqual({ active: false });
    expect(chrome.tabs.remove).toHaveBeenCalledWith(TAB);
  });

  it("leaves the tab open when closing is off", async () => {
    await handleMessage({ type: "flowFinished", closeTab: false }, TAB);
    expect(chrome.tabs.remove).not.toHaveBeenCalled();
  });

  it("forgets a closed tab", async () => {
    await handleMessage({ type: "markFlow" }, TAB);
    await forgetTab(TAB);
    expect(await handleMessage({ type: "isFlowActive" }, TAB)).toEqual({ active: false });
  });
});
