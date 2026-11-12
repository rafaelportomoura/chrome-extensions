import { describe, expect, it } from "vitest";
import {
  centerView,
  fitView,
  MAX_ZOOM,
  MIN_ZOOM,
  panBy,
  stepZoom,
  wheelPixels,
  wheelZoom,
  zoomAt,
  zoomLabel,
} from "../src/canvas-view";

const frame = { width: 864, height: 464 };

describe("fitView", () => {
  it("fits a wide drawing to the frame width with a 32 px margin, centered", () => {
    const view = fitView({ width: 1600, height: 400 }, frame);
    expect(view.zoom).toBeCloseTo(0.5);
    expect(view.x).toBeCloseTo(32);
    expect(view.y).toBeCloseTo((464 - 200) / 2);
  });

  it("upscales a small drawing", () => {
    expect(fitView({ width: 100, height: 50 }, frame).zoom).toBeCloseTo(8);
  });

  it("keeps the zoom inside the limits", () => {
    expect(fitView({ width: 1, height: 1 }, frame).zoom).toBe(MAX_ZOOM);
    expect(fitView({ width: 1e6, height: 1e6 }, frame).zoom).toBe(MIN_ZOOM);
  });

  it("shows an empty drawing at 100%", () => {
    expect(fitView({ width: 0, height: 0 }, frame)).toEqual({ zoom: 1, x: 432, y: 232 });
  });
});

describe("centerView", () => {
  it("centers the content at 100%", () => {
    expect(centerView({ width: 20, height: 20 }, frame)).toEqual({ zoom: 1, x: 422, y: 222 });
  });
});

describe("zoomAt", () => {
  it("keeps the content under the point fixed", () => {
    const view = { zoom: 1, x: 10, y: 20 };
    const next = zoomAt(view, 2, { x: 110, y: 120 });
    expect(next.zoom).toBe(2);
    // Content point (100, 100) stays at (110, 120).
    expect(100 * next.zoom + next.x).toBeCloseTo(110);
    expect(100 * next.zoom + next.y).toBeCloseTo(120);
  });

  it("clamps the zoom to 10%–3000%", () => {
    const view = { zoom: 1, x: 0, y: 0 };
    expect(zoomAt(view, 100, { x: 0, y: 0 }).zoom).toBe(30);
    expect(zoomAt(view, 0.01, { x: 0, y: 0 }).zoom).toBe(0.1);
  });
});

describe("panBy", () => {
  it("moves the drawing by the delta", () => {
    expect(panBy({ zoom: 2, x: 5, y: 5 }, -10, 20)).toEqual({ zoom: 2, x: -5, y: 25 });
  });
});

describe("stepZoom", () => {
  it.each([
    [1, 1, 1.1],
    [1, -1, 0.9],
    [1.234, 1, 1.3],
    [1.234, -1, 1.2],
    [30, 1, 30],
    [0.1, -1, 0.1],
  ] as const)("steps %s by %s to %s", (zoom, direction, expected) => {
    expect(stepZoom(zoom, direction)).toBeCloseTo(expected);
  });
});

describe("wheelZoom", () => {
  it("zooms in on a negative delta and out on a positive one, at most 10% per event", () => {
    expect(wheelZoom(1, -5)).toBeCloseTo(1.05);
    expect(wheelZoom(1, 500)).toBeCloseTo(0.9);
  });

  it("stays inside the limits", () => {
    expect(wheelZoom(30, -100)).toBe(30);
    expect(wheelZoom(0.1, 100)).toBe(0.1);
  });
});

describe("wheelPixels", () => {
  it("reads pixel, line and page deltas as pixels", () => {
    expect(wheelPixels(30, 0, 500)).toBe(30);
    expect(wheelPixels(3, 1, 500)).toBe(48);
    expect(wheelPixels(1, 2, 500)).toBe(500);
  });
});

describe("zoomLabel", () => {
  it("shows a whole percentage", () => {
    expect(zoomLabel(1.234)).toBe("123%");
  });
});
