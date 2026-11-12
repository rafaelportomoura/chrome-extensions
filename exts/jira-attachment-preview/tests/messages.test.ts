import { describe, expect, it, vi } from "vitest";
import { framePreview, isRenderMessage, RENDER_TYPE } from "../src/messages";

const payload = {
  fileName: "a.md",
  kind: "markdown" as const,
  content: "# A",
  theme: "dark" as const,
};

describe("isRenderMessage", () => {
  it("accepts a complete render message", () => {
    expect(isRenderMessage({ type: RENDER_TYPE, ...payload })).toBe(true);
  });

  it.each([null, "x", { type: RENDER_TYPE, ...payload, kind: "svg" }, { ...payload }])(
    "rejects %j",
    (data) => {
      expect(isRenderMessage(data)).toBe(false);
    },
  );
});

describe("framePreview", () => {
  it("sends the payload once the sandboxed frame is ready", () => {
    const frame = framePreview(document.body, payload, "about:blank");
    const target = frame.contentWindow;
    if (!target) throw new Error("no frame window");
    const post = vi.spyOn(target, "postMessage");
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "jira-attachment-preview:ready" },
        source: target,
      }),
    );
    expect(post).toHaveBeenCalledWith({ type: RENDER_TYPE, ...payload }, "*");
  });

  it("ignores ready messages from other windows", () => {
    const frame = framePreview(document.body, payload, "about:blank");
    const target = frame.contentWindow;
    if (!target) throw new Error("no frame window");
    const post = vi.spyOn(target, "postMessage");
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "jira-attachment-preview:ready" },
        source: window,
      }),
    );
    expect(post).not.toHaveBeenCalled();
  });
});
