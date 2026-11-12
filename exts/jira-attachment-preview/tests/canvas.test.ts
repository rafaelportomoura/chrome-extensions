import { beforeEach, describe, expect, it } from "vitest";
import { type CanvasHandle, mountCanvas } from "../src/canvas";

const SVG_NS = "http://www.w3.org/2000/svg";

function drawing(width: number, height: number): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  return svg;
}

let root: HTMLElement;
let canvas: CanvasHandle;

function element(selector: string): HTMLElement {
  const found = root.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(`missing ${selector}`);
  return found;
}

function click(title: string): void {
  element(`button[title="${title}"]`).click();
}

function wheel(init: WheelEventInit): WheelEvent {
  const event = new WheelEvent("wheel", { bubbles: true, cancelable: true, ...init });
  element(".canvas").dispatchEvent(event);
  return event;
}

function pointer(type: string, init: { clientX: number; clientY: number; button?: number }) {
  const event = new MouseEvent(type, { bubbles: true, button: 0, ...init });
  Object.defineProperty(event, "pointerId", { value: 1 });
  element(".canvas").dispatchEvent(event);
}

beforeEach(() => {
  root = document.createElement("main");
  Object.defineProperty(root, "clientWidth", { value: 864, configurable: true });
  Object.defineProperty(root, "clientHeight", { value: 464, configurable: true });
  document.body.append(root);
  canvas = mountCanvas(root, drawing(1600, 400), "#fff9db");
});

describe("mountCanvas", () => {
  it("opens fitted, with the zoom shown and the background on the whole Canvas", () => {
    expect(canvas.view().zoom).toBeCloseTo(0.5);
    expect(element(".zoom-level").textContent).toBe("50%");
    expect(element(".canvas").style.background).toBe("rgb(255, 249, 219)");
    const svg = element("svg");
    expect(svg.style.width).toBe("800px");
    expect(svg.style.left).toBe("32px");
  });

  it("pans on a plain wheel event and keeps the page from scrolling", () => {
    const before = canvas.view();
    const event = wheel({ deltaX: 10, deltaY: 30 });
    expect(event.defaultPrevented).toBe(true);
    expect(canvas.view()).toEqual({ ...before, x: before.x - 10, y: before.y - 30 });
  });

  it.each([{ ctrlKey: true }, { metaKey: true }])(
    "zooms around the pointer on %o + wheel",
    (modifier) => {
      const before = canvas.view();
      wheel({ deltaY: -10, clientX: 100, clientY: 100, ...modifier });
      const after = canvas.view();
      expect(after.zoom).toBeGreaterThan(before.zoom);
      const contentX = (100 - before.x) / before.zoom;
      expect(contentX * after.zoom + after.x).toBeCloseTo(100);
    },
  );

  it("pans while dragging with the primary button", () => {
    const before = canvas.view();
    pointer("pointerdown", { clientX: 10, clientY: 10 });
    pointer("pointermove", { clientX: 30, clientY: 5 });
    pointer("pointerup", { clientX: 30, clientY: 5 });
    pointer("pointermove", { clientX: 90, clientY: 90 });
    expect(canvas.view()).toEqual({ ...before, x: before.x + 20, y: before.y - 5 });
  });

  it("stops dragging when the pointer capture is lost", () => {
    const before = canvas.view();
    pointer("pointerdown", { clientX: 10, clientY: 10 });
    element(".canvas").dispatchEvent(new Event("lostpointercapture"));
    pointer("pointermove", { clientX: 50, clientY: 50 });
    expect(canvas.view()).toEqual(before);
  });

  it("reads a line-mode wheel delta as lines of 16 px", () => {
    const before = canvas.view();
    wheel({ deltaY: 3, deltaMode: 1 });
    expect(canvas.view().y).toBe(before.y - 48);
  });

  it("refits an untouched drawing when the frame is resized", () => {
    Object.defineProperty(root, "clientWidth", { value: 464, configurable: true });
    window.dispatchEvent(new Event("resize"));
    expect(canvas.view().zoom).toBeCloseTo(0.25);
  });

  it("keeps a moved drawing where it is when the frame is resized", () => {
    wheel({ deltaY: 30 });
    const moved = canvas.view();
    Object.defineProperty(root, "clientWidth", { value: 464, configurable: true });
    window.dispatchEvent(new Event("resize"));
    expect(canvas.view()).toEqual(moved);
  });

  it("ignores a drag with another button", () => {
    const before = canvas.view();
    pointer("pointerdown", { clientX: 10, clientY: 10, button: 2 });
    pointer("pointermove", { clientX: 30, clientY: 30 });
    expect(canvas.view()).toEqual(before);
  });

  it("steps the zoom with + and −, and resets to 100% from the percentage", () => {
    click("Zoom in");
    expect(element(".zoom-level").textContent).toBe("60%");
    click("Zoom out");
    click("Zoom out");
    expect(element(".zoom-level").textContent).toBe("40%");
    click("Reset zoom to 100%");
    expect(canvas.view().zoom).toBe(1);
    expect(element(".zoom-level").textContent).toBe("100%");
  });

  it("restores the opening view with Fit", () => {
    const initial = canvas.view();
    wheel({ deltaY: -50, ctrlKey: true, clientX: 5, clientY: 5 });
    wheel({ deltaX: 40, deltaY: 40 });
    click("Back to the opening view");
    expect(canvas.view()).toEqual(initial);
  });

  it("stops at 3000%", () => {
    for (let i = 0; i < 200; i++) wheel({ deltaY: -100, ctrlKey: true });
    expect(canvas.view().zoom).toBe(30);
    expect(element(".zoom-level").textContent).toBe("3000%");
  });
});
