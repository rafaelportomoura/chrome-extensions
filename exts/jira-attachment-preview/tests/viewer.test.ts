import { describe, expect, it, vi } from "vitest";
import {
  ADDED_ATTRIBUTE,
  mountControls,
  mountPreviewHost,
  readViewer,
  removeAdded,
  watchViewer,
} from "../src/viewer";
import { closeViewer, openViewer, switchFile } from "./fixtures/viewer";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("readViewer", () => {
  it("reads the file name and metadata", () => {
    openViewer();
    expect(readViewer(document)).toMatchObject({ name: "proto.html", sizeText: "html · 14 KB" });
  });

  it("returns null without a viewer", () => {
    expect(readViewer(document)).toBeNull();
  });
});

describe("watchViewer", () => {
  it("reports open, switch and close", async () => {
    const onChange = vi.fn();
    const stop = watchViewer(document, onChange);
    openViewer();
    await flush();
    switchFile("notes.md", "md · 2 KB");
    await flush();
    closeViewer();
    await flush();
    stop();
    expect(onChange.mock.calls.map(([file]) => file?.name ?? null)).toEqual([
      "proto.html",
      "notes.md",
      null,
    ]);
  });

  it("ignores changes that keep the same file", async () => {
    openViewer();
    const onChange = vi.fn();
    const stop = watchViewer(document, onChange);
    document.querySelector(".content")?.append(document.createElement("span"));
    await flush();
    stop();
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe("mountControls", () => {
  function mount() {
    openViewer();
    const file = readViewer(document);
    if (!file) throw new Error("no viewer");
    const handlers = { onPreview: vi.fn(), onSource: vi.fn(), onOpenTab: vi.fn() };
    return { controls: mountControls(file, handlers), handlers };
  }

  function buttonNamed(label: string): HTMLButtonElement {
    const found = [...document.querySelectorAll("button")].find((b) => b.textContent === label);
    if (!found) throw new Error(`no ${label} button`);
    return found;
  }

  it("sits left of the download button", () => {
    const { controls } = mount();
    expect(controls.root.nextElementSibling?.getAttribute("data-testid")).toBe(
      "media-viewer-download-button",
    );
  });

  it("calls the handlers and marks the active side", () => {
    const { controls, handlers } = mount();
    controls.setState("preview");
    buttonNamed("Source").click();
    buttonNamed("Preview").click();
    buttonNamed("Open in new tab").click();
    expect(handlers.onSource).toHaveBeenCalled();
    expect(handlers.onPreview).toHaveBeenCalled();
    expect(handlers.onOpenTab).toHaveBeenCalled();
    expect(buttonNamed("Preview").getAttribute("aria-pressed")).toBe("true");
  });

  it("shows the reason and hides the buttons in the error state", () => {
    const { controls } = mount();
    controls.setState("error", "file larger than 5 MB");
    expect(controls.root.querySelector('[role="status"]')?.textContent).toBe(
      "file larger than 5 MB",
    );
    expect(buttonNamed("Preview").hidden).toBe(true);
  });
});

describe("removeAdded", () => {
  it("removes the controls and the preview host", () => {
    openViewer();
    const file = readViewer(document);
    if (!file) throw new Error("no viewer");
    mountControls(file, { onPreview: vi.fn(), onSource: vi.fn(), onOpenTab: vi.fn() });
    mountPreviewHost(file);
    expect(document.querySelectorAll(`[${ADDED_ATTRIBUTE}]`)).toHaveLength(2);
    removeAdded(document);
    expect(document.querySelectorAll(`[${ADDED_ATTRIBUTE}]`)).toHaveLength(0);
  });
});
