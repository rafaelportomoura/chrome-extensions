// DOM helpers shared by the PIP and Microsoft page drivers.

export interface ClickContext {
  doc: Document;
  /** Elements already clicked, so a re-render never clicks the same element twice. */
  clicked: WeakSet<Element>;
}

/**
 * Visible, not yet clicked elements matching `selector` and `accept`. `accept` runs before the
 * visibility check, which forces a layout: on a page polled for its whole lifetime, only the
 * few elements that pass `accept` get measured.
 */
export function candidates(
  ctx: ClickContext,
  selector: string,
  accept: (el: HTMLElement) => boolean = () => true,
): HTMLElement[] {
  return [...ctx.doc.querySelectorAll<HTMLElement>(selector)]
    .filter((el) => !ctx.clicked.has(el))
    .filter(accept)
    .filter(isVisible);
}

export function click(ctx: ClickContext, el: HTMLElement): true {
  ctx.clicked.add(el);
  el.scrollIntoView({ block: "center" });
  el.click();
  return true;
}

export function isEnabled(el: HTMLElement): boolean {
  return !(el as HTMLButtonElement).disabled && el.getAttribute("aria-disabled") !== "true";
}

/** The visible label of a button: its text, or the value of an `<input>` button. */
export function buttonLabel(el: HTMLElement): string {
  const text = el instanceof HTMLInputElement ? el.value : el.textContent;
  return (text ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

export function matchesLabel(label: string, labels: string[]): boolean {
  return labels.includes(label);
}

function isVisible(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== "hidden";
}
