// Clicks through one sign-in page: the account chooser (Google's, or the Microsoft SSO one a
// Google Workspace account federates to), the "Select all" scopes checkbox and the
// Continue / Allow buttons.
import { log } from "./log";

export const CONTINUE_LABELS = ["continue", "allow", "continuar", "permitir"];
export const SELECT_ALL_LABELS = ["select all", "selecionar tudo", "selecionar todos"];

/**
 * Account tiles carry the account email in an attribute: `data-identifier` / `data-email` on
 * Google, `data-test-id` on Microsoft (whose tiles also hold `<email>-menu-dots` menu buttons,
 * which the email check below rejects).
 */
const ACCOUNT_ATTRIBUTES = ["data-identifier", "data-email", "data-test-id"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export interface PageContext {
  doc: Document;
  preferredEmail: string;
  /** Elements already clicked, so a re-render never clicks the same element twice. */
  clicked: WeakSet<Element>;
}

/** Takes the next action available on the page. Returns whether it clicked anything. */
export function advance(ctx: PageContext): boolean {
  return pickAccount(ctx) || selectAllScopes(ctx) || clickContinue(ctx);
}

export function pickAccount(ctx: PageContext): boolean {
  const accounts = candidates(ctx, ACCOUNT_ATTRIBUTES.map((name) => `[${name}]`).join(", ")).filter(
    (el) => EMAIL.test(emailOf(el)),
  );
  if (accounts.length === 0) return false;

  const preferred = ctx.preferredEmail.trim().toLowerCase();

  let target: HTMLElement | undefined;
  if (preferred) {
    target = accounts.find((el) => emailOf(el) === preferred);
  } else if (new Set(accounts.map(emailOf)).size === 1) {
    target = accounts[0];
  }
  if (!target) return false;

  log("choosing account", emailOf(target));
  return click(ctx, target);
}

export function selectAllScopes(ctx: PageContext): boolean {
  const box = candidates(ctx, 'input[type="checkbox"], [role="checkbox"]')
    .filter((el) => matchesLabel(accessibleLabel(ctx.doc, el), SELECT_ALL_LABELS))
    .find((el) => !isChecked(el));
  if (!box) return false;

  log("selecting all scopes");
  return click(ctx, box);
}

export function clickContinue(ctx: PageContext): boolean {
  const button = candidates(ctx, 'button, [role="button"]')
    .filter((el) => !(el as HTMLButtonElement).disabled)
    .filter((el) => el.getAttribute("aria-disabled") !== "true")
    .find((el) => matchesLabel(el.textContent, CONTINUE_LABELS));
  if (!button) return false;

  log("clicking", button.textContent?.trim());
  return click(ctx, button);
}

function emailOf(el: HTMLElement): string {
  const attribute = ACCOUNT_ATTRIBUTES.find((name) => el.getAttribute(name));
  return (attribute ? (el.getAttribute(attribute) ?? "") : "").trim().toLowerCase();
}

function candidates(ctx: PageContext, selector: string): HTMLElement[] {
  return [...ctx.doc.querySelectorAll<HTMLElement>(selector)]
    .filter(isVisible)
    .filter((el) => !ctx.clicked.has(el));
}

function click(ctx: PageContext, el: HTMLElement): true {
  ctx.clicked.add(el);
  el.scrollIntoView({ block: "center" });
  el.click();
  return true;
}

function accessibleLabel(doc: Document, el: HTMLElement): string {
  const labelledBy = el.getAttribute("aria-labelledby");
  const byId = labelledBy ? doc.getElementById(labelledBy)?.textContent : undefined;
  return (
    el.getAttribute("aria-label") ||
    byId ||
    el.closest("label")?.textContent ||
    (el.id ? doc.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent : undefined) ||
    ""
  );
}

function matchesLabel(text: string | null | undefined, labels: string[]): boolean {
  return labels.includes((text ?? "").trim().toLowerCase());
}

function isChecked(el: HTMLElement): boolean {
  return (el as HTMLInputElement).checked === true || el.getAttribute("aria-checked") === "true";
}

function isVisible(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== "hidden";
}
