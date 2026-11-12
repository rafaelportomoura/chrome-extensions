import { describe, expect, it, type vi } from "vitest";
import type { PreviewPayload } from "../src/messages";
import { loadSnapshot, openSnapshotTab } from "../src/snapshot";
import { EXPIRED_TEXT, showSnapshot } from "../src/tab-page";

const snapshot: PreviewPayload = {
  fileName: "proto.html",
  kind: "html",
  content: "<p>hi</p>",
  theme: "light",
};

describe("openSnapshotTab", () => {
  it("stores the snapshot and opens the tab on its id", async () => {
    await openSnapshotTab(snapshot);
    const [{ url }] = (chrome.tabs.create as unknown as { mock: { calls: [{ url: string }][] } })
      .mock.calls[0] ?? [{ url: "" }];
    const id = new URL(url).searchParams.get("id");
    expect(url).toMatch(/^chrome-extension:\/\/test-id\/tab\.html\?id=/);
    await expect(loadSnapshot(id)).resolves.toEqual(snapshot);
  });
});

describe("openSnapshotTab when session storage is full", () => {
  it("keeps snapshots when storing fails for another reason", async () => {
    await chrome.storage.session.set({ "snapshot:old": snapshot });
    const set = chrome.storage.session.set as unknown as ReturnType<typeof vi.fn>;
    set.mockImplementationOnce(async () => {
      throw new Error("Invalid value");
    });
    await expect(openSnapshotTab(snapshot)).rejects.toThrow("Invalid value");
    await expect(loadSnapshot("old")).resolves.toEqual(snapshot);
  });

  it("drops older snapshots to make room", async () => {
    await chrome.storage.session.set({ "snapshot:old": snapshot, other: 1 });
    const set = chrome.storage.session.set as unknown as ReturnType<typeof vi.fn>;
    const original = set.getMockImplementation();
    set.mockImplementationOnce(async () => {
      throw new Error("QUOTA_BYTES quota exceeded");
    });
    if (original) set.mockImplementation(original);
    await openSnapshotTab(snapshot);
    await expect(loadSnapshot("old")).resolves.toBeNull();
    const stored = await chrome.storage.session.get(null);
    expect(Object.keys(stored).filter((k) => k.startsWith("snapshot:"))).toHaveLength(1);
    expect(stored.other).toBe(1);
  });
});

describe("loadSnapshot", () => {
  it("returns null for a missing id or an unknown one", async () => {
    await expect(loadSnapshot(null)).resolves.toBeNull();
    await expect(loadSnapshot("gone")).resolves.toBeNull();
  });
});

describe("showSnapshot", () => {
  it("frames the preview page for a stored snapshot", async () => {
    await chrome.storage.session.set({ "snapshot:abc": snapshot });
    document.body.innerHTML = "<main></main>";
    await showSnapshot(document, "?id=abc");
    const frame = document.querySelector("main iframe");
    expect(frame?.getAttribute("src")).toBe("chrome-extension://test-id/preview.html");
    expect(frame?.getAttribute("sandbox")).toBe("allow-scripts");
    expect(document.title).toBe("proto.html");
  });

  it("explains an expired snapshot", async () => {
    document.body.innerHTML = "<main></main>";
    await showSnapshot(document, "?id=gone");
    expect(document.querySelector("main")?.textContent).toBe(EXPIRED_TEXT);
  });
});
