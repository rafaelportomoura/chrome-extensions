// DOM helpers shared by the PIP and Microsoft page drivers.

export interface ClickContext {
  doc: Document;
  /** Elements already clicked, so a re-render never clicks the same element twice. */
  clicked: WeakSet<Element>;
}

export function candidates(ctx: ClickContext, selector: string): HTMLElement[] {
  return [...ctx.doc.querySelectorAll<HTMLElement>(selector)]
    .filter(isVisible)
    .filter((el) => !ctx.clicked.has(el));
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
