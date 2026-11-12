// The Canvas: an endless plane that shows one SVG drawing, with Excalidraw's gestures (wheel pans,
// Ctrl/⌘-wheel and pinch zoom around the pointer, drag pans) and a bottom-left zoom control.
import {
  centerView,
  fitView,
  panBy,
  type Size,
  stepZoom,
  type Viewport,
  wheelPixels,
  wheelZoom,
  zoomAt,
  zoomLabel,
} from "./canvas-view";

export interface CanvasHandle {
  /** The current viewport. */
  view(): Viewport;
}

/** The SVG's own size in content pixels, from its width/height or viewBox. */
function svgSize(svg: SVGSVGElement): Size {
  const width = Number.parseFloat(svg.getAttribute("width") ?? "");
  const height = Number.parseFloat(svg.getAttribute("height") ?? "");
  if (width > 0 && height > 0) return { width, height };
  const box = (svg.getAttribute("viewBox") ?? "").split(/[\s,]+/).map(Number);
  return { width: box[2] || 0, height: box[3] || 0 };
}

function button(doc: Document, label: string, title: string, onClick: () => void) {
  const element = doc.createElement("button");
  element.type = "button";
  element.textContent = label;
  element.title = title;
  element.setAttribute("aria-label", title);
  element.addEventListener("click", onClick);
  return element;
}

/**
 * Replaces `root`'s children with a Canvas showing `svg` on `background`, fitted to `root`, or at
 * 100% when `empty` (an empty drawing's SVG is only its padding, nothing to fit).
 * The SVG is resized rather than CSS-scaled, so it stays sharp at any zoom.
 */
export function mountCanvas(
  root: HTMLElement,
  svg: SVGSVGElement,
  background: string,
  empty = false,
): CanvasHandle {
  const doc = root.ownerDocument;
  const content = svgSize(svg);
  if (!svg.getAttribute("viewBox") && content.width > 0) {
    svg.setAttribute("viewBox", `0 0 ${content.width} ${content.height}`);
  }
  const frame = (): Size => ({ width: root.clientWidth, height: root.clientHeight });
  const initialView = (): Viewport =>
    empty ? centerView(content, frame()) : fitView(content, frame());
  let fitted = initialView();
  let view = fitted;
  const refit = (): void => {
    fitted = initialView();
    apply(fitted);
  };
  const zoomToCenter = (zoom: number): void => {
    const { width, height } = frame();
    apply(zoomAt(view, zoom, { x: width / 2, y: height / 2 }));
  };

  const canvas = doc.createElement("div");
  canvas.className = "canvas";
  canvas.style.background = background;
  svg.classList.add("canvas-drawing");
  const label = button(doc, "", "Reset zoom to 100%", () => zoomToCenter(1));
  label.className = "zoom-level";
  const control = doc.createElement("div");
  control.className = "zoom-control";
  control.append(
    button(doc, "−", "Zoom out", () => zoomToCenter(stepZoom(view.zoom, -1))),
    label,
    button(doc, "+", "Zoom in", () => zoomToCenter(stepZoom(view.zoom, 1))),
    button(doc, "Fit", "Zoom to fit the drawing", refit),
  );
  canvas.append(svg, control);
  root.replaceChildren(canvas);

  function apply(next: Viewport): void {
    view = next;
    svg.style.left = `${view.x}px`;
    svg.style.top = `${view.y}px`;
    svg.style.width = `${content.width * view.zoom}px`;
    svg.style.height = `${content.height * view.zoom}px`;
    label.textContent = zoomLabel(view.zoom);
  }

  const pointer = (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  canvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const dx = wheelPixels(event.deltaX, event.deltaMode, root.clientWidth);
      const dy = wheelPixels(event.deltaY, event.deltaMode, root.clientHeight);
      // Chrome reports a trackpad pinch as a wheel event with ctrlKey set.
      if (event.ctrlKey || event.metaKey) {
        apply(zoomAt(view, wheelZoom(view.zoom, dy), pointer(event)));
      } else {
        apply(panBy(view, -dx, -dy));
      }
    },
    { passive: false },
  );

  let drag: { x: number; y: number } | null = null;
  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || control.contains(event.target as Node)) return;
    drag = { x: event.clientX, y: event.clientY };
    canvas.classList.add("dragging");
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drag) return;
    apply(panBy(view, event.clientX - drag.x, event.clientY - drag.y));
    drag = { x: event.clientX, y: event.clientY };
  });
  const endDrag = () => {
    drag = null;
    canvas.classList.remove("dragging");
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("lostpointercapture", endDrag);

  // Keep a drawing the user has not moved fitted when the frame is resized.
  doc.defaultView?.addEventListener("resize", () => {
    if (view === fitted) refit();
  });

  apply(fitted);
  return { view: () => view };
}
