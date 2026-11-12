// Drives the PIP sign-in page: finds the "Sign in with Microsoft" button.
import { buttonLabel, type ClickContext, candidates, isEnabled, matchesLabel } from "./dom";

export const SIGN_IN_LABELS = [
  "sign in with microsoft",
  "entrar com microsoft",
  "entrar com a microsoft",
];

const BUTTONS = 'button, [role="button"]';

/** The visible, enabled "Sign in with Microsoft" button, if the page shows one. */
export function findSignInButton(ctx: ClickContext): HTMLElement | undefined {
  return candidates(
    ctx,
    BUTTONS,
    (el) => isEnabled(el) && matchesLabel(buttonLabel(el), SIGN_IN_LABELS),
  )[0];
}

/** Whether a PIP path is one of the app's sign-in routes (`/auth/sign-in`, `/auth/login`, ...). */
export function isAuthPath(pathname: string): boolean {
  return pathname === "/auth" || pathname.startsWith("/auth/");
}

/** How long the tab must stay outside the sign-in routes before the flow counts as finished. */
export const SETTLE_MS = 5 * 1000;

export type PipStep = "click" | "blocked" | "finished" | "wait";

export interface PipState {
  hasButton: boolean;
  /** Whether the tab is inside an active flow; only read when the button shows. */
  isFlowActive: () => Promise<boolean>;
  pathname: string;
  /** Since when the tab has been outside the sign-in routes without the button, if it has. */
  outsideSince: number | undefined;
  now: number;
}

/**
 * Decides what the PIP page does next:
 * - `click`: the sign-in button shows and no flow is active;
 * - `blocked`: the button shows again while a flow is active, so the sign-in likely failed and
 *   clicking again would loop; the user takes over;
 * - `finished`: the tab has stayed in the app, outside the sign-in routes, for `SETTLE_MS`;
 * - `wait`: none of the above yet.
 */
export async function nextPipStep(state: PipState): Promise<PipStep> {
  if (state.hasButton) return (await state.isFlowActive()) ? "blocked" : "click";
  if (isAuthPath(state.pathname) || state.outsideSince === undefined) return "wait";
  return state.now - state.outsideSince >= SETTLE_MS ? "finished" : "wait";
}
