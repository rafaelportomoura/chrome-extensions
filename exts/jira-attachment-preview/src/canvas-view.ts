// The Canvas's viewport and its pure transitions: where the drawing sits on screen and at what
// zoom. A content point (cx, cy) shows at (cx * zoom + x, cy * zoom + y) in frame pixels.

export interface Viewport {
  zoom: number;
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

/** Excalidraw's zoom limits: 10% and 3000%. */
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 30;
/** Space kept between a fitted drawing and the frame's edges, in frame pixels. */
export const FIT_MARGIN = 32;
/** One "+" / "−" click, as in Excalidraw. */
const ZOOM_STEP = 0.1;
/** The most one wheel event may zoom, as a fraction of the current zoom. */
const MAX_WHEEL_ZOOM = 0.1;

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/** The viewport that shows the content at 100%, centered in the frame. */
export function centerView(content: Size, frame: Size): Viewport {
  return { zoom: 1, x: (frame.width - content.width) / 2, y: (frame.height - content.height) / 2 };
}

/** The viewport that shows the whole content centered in the frame, FIT_MARGIN from its edges. */
export function fitView(content: Size, frame: Size): Viewport {
  if (content.width <= 0 || content.height <= 0) return centerView(content, frame);
  const available = {
    width: Math.max(1, frame.width - 2 * FIT_MARGIN),
    height: Math.max(1, frame.height - 2 * FIT_MARGIN),
  };
  const zoom = clampZoom(
    Math.min(available.width / content.width, available.height / content.height),
  );
  return {
    zoom,
    x: (frame.width - content.width * zoom) / 2,
    y: (frame.height - content.height * zoom) / 2,
  };
}

/** The viewport at `zoom` (clamped) that keeps the content under `point` where it is. */
export function zoomAt(view: Viewport, zoom: number, point: Point): Viewport {
  const next = clampZoom(zoom);
  const contentX = (point.x - view.x) / view.zoom;
  const contentY = (point.y - view.y) / view.zoom;
  return { zoom: next, x: point.x - contentX * next, y: point.y - contentY * next };
}

export function panBy(view: Viewport, dx: number, dy: number): Viewport {
  return { ...view, x: view.x + dx, y: view.y + dy };
}

/** The zoom one "+" (1) or "−" (-1) click gives: the next tenth, clamped. */
export function stepZoom(zoom: number, direction: 1 | -1): number {
  const tenths = zoom / ZOOM_STEP;
  const next = direction === 1 ? Math.floor(tenths + 1e-9) + 1 : Math.ceil(tenths - 1e-9) - 1;
  return clampZoom(next * ZOOM_STEP);
}

/** Pixels per line for a wheel event in line mode (`deltaMode` 1). */
const LINE_PIXELS = 16;

/** A wheel delta in pixels, whatever its `deltaMode` (pixels, lines or pages). */
export function wheelPixels(delta: number, deltaMode: number, pageSize: number): number {
  if (deltaMode === 1) return delta * LINE_PIXELS;
  if (deltaMode === 2) return delta * pageSize;
  return delta;
}

/** The zoom after a Ctrl/⌘-wheel or pinch event of `deltaY` pixels (negative zooms in). */
export function wheelZoom(zoom: number, deltaY: number): number {
  const factor = Math.min(Math.abs(deltaY) / 100, MAX_WHEEL_ZOOM);
  return clampZoom(zoom * (1 - Math.sign(deltaY) * factor));
}

/** The zoom as the control shows it, e.g. 1.234 → "123%". */
export function zoomLabel(zoom: number): string {
  return `${Math.round(zoom * 100)}%`;
}
