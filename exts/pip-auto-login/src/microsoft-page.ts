// Drives one Microsoft SSO page: picks the preferred account on the account chooser and
// answers Yes on "Stay signed in?". Consent, password and MFA pages are left to the user.
import { buttonLabel, type ClickContext, candidates, click, isEnabled, matchesLabel } from "./dom";
import { log } from "./log";

export const STAY_SIGNED_IN_LABELS = ["yes", "sim"];
export const STAY_SIGNED_IN_TITLES = [
  "stay signed in",
  "continuar conectado",
  "manter-se conectado",
];

/** Microsoft account tiles carry the email in `data-test-id`; menu buttons add `-menu-dots`. */
const ACCOUNT_SELECTOR = "[data-test-id]";
const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
/** Markers of the "Stay signed in?" page besides its title. */
const KMSI_MARKERS = '#KmsiCheckboxField, input[name="DontShowAgain"], #kmsiTitle';
const BUTTONS = 'button, [role="button"], input[type="submit"], input[type="button"]';

export interface PageContext extends ClickContext {
  /** An email, an `@domain`, or empty (see `Settings.preferredAccount`). */
  preferredAccount: string;
}

/** Takes the next action available on the page. Returns whether it clicked anything. */
export function advance(ctx: PageContext): boolean {
  return pickAccount(ctx) || staySignedIn(ctx);
}

export function pickAccount(ctx: PageContext): boolean {
  const accounts = candidates(ctx, ACCOUNT_SELECTOR).filter((el) => EMAIL.test(emailOf(el)));
  if (accounts.length === 0) return false;

  const target = choose(accounts, ctx.preferredAccount.trim().toLowerCase());
  if (!target) return false;

  log("choosing account", emailOf(target));
  return click(ctx, target);
}

export function staySignedIn(ctx: PageContext): boolean {
  if (!isStaySignedInPage(ctx.doc)) return false;
  const yes = candidates(ctx, BUTTONS)
    .filter(isEnabled)
    .find((el) => matchesLabel(buttonLabel(el), STAY_SIGNED_IN_LABELS));
  if (!yes) return false;

  log("answering yes to stay signed in");
  return click(ctx, yes);
}

/**
 * The account to pick: the one matching the preferred email, the only one in the preferred
 * `@domain`, or the only one on the chooser when no preference is set. Undefined when the match
 * is missing or ambiguous.
 */
function choose(accounts: HTMLElement[], preferred: string): HTMLElement | undefined {
  const byEmail = new Map<string, HTMLElement>();
  for (const el of accounts) if (!byEmail.has(emailOf(el))) byEmail.set(emailOf(el), el);
  const emails = [...byEmail.keys()];

  let matching: string[];
  if (preferred === "") matching = emails;
  else if (preferred.startsWith("@"))
    matching = emails.filter((email) => email.endsWith(preferred));
  else matching = emails.filter((email) => email === preferred);

  const [only, ...rest] = matching;
  return only !== undefined && rest.length === 0 ? byEmail.get(only) : undefined;
}

function isStaySignedInPage(doc: Document): boolean {
  if (doc.querySelector(KMSI_MARKERS)) return true;
  const text = (doc.body?.textContent ?? "").replace(/\s+/g, " ").toLowerCase();
  return STAY_SIGNED_IN_TITLES.some((title) => text.includes(title));
}

function emailOf(el: HTMLElement): string {
  return (el.getAttribute("data-test-id") ?? "").trim().toLowerCase();
}
