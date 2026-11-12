import { describe, expect, it, vi } from "vitest";
import {
  findSignInButton,
  isAuthPath,
  nextPipStep,
  type PipState,
  SETTLE_MS,
} from "../src/pip-page";

const ctx = () => ({ doc: document, clicked: new WeakSet<Element>() });

describe("findSignInButton", () => {
  // Markup captured from web.dev-pip.internal/auth/sign-in.
  const signIn = `
    <section><h1>Login</h1>
      <button type="button" data-slot="button" id="ms">
        <svg aria-hidden="true"><rect></rect></svg>Sign in with Microsoft</button>
      <p role="alert"></p>
    </section>`;

  it("finds the PIP button by its text", () => {
    document.body.innerHTML = signIn;
    expect(findSignInButton(ctx())?.id).toBe("ms");
  });

  it("matches the Portuguese label", () => {
    document.body.innerHTML = '<button id="ms">Entrar com a Microsoft</button>';
    expect(findSignInButton(ctx())?.id).toBe("ms");
  });

  it("skips disabled, hidden and unrelated buttons", () => {
    document.body.innerHTML = `
      <button disabled>Sign in with Microsoft</button>
      <div hidden><button>Sign in with Microsoft</button></div>
      <button>Sign out</button>`;
    expect(findSignInButton(ctx())).toBeUndefined();
  });

  it("skips a button already clicked", () => {
    document.body.innerHTML = signIn;
    const c = ctx();
    const button = findSignInButton(c);
    if (button) c.clicked.add(button);
    expect(findSignInButton(c)).toBeUndefined();
  });
});

describe("isAuthPath", () => {
  it("recognises the sign-in routes", () => {
    expect(isAuthPath("/auth/sign-in")).toBe(true);
    expect(isAuthPath("/auth/login")).toBe(true);
    expect(isAuthPath("/")).toBe(false);
    expect(isAuthPath("/authors")).toBe(false);
  });
});

describe("nextPipStep", () => {
  const state = (overrides: Partial<PipState>): PipState => ({
    hasButton: false,
    isFlowActive: async () => false,
    pathname: "/",
    outsideSince: undefined,
    now: 10_000,
    ...overrides,
  });

  it("clicks the button when no flow is active", async () => {
    expect(await nextPipStep(state({ hasButton: true }))).toBe("click");
  });

  it("stops when the button shows again during an active flow", async () => {
    const step = await nextPipStep(state({ hasButton: true, isFlowActive: async () => true }));
    expect(step).toBe("blocked");
  });

  it("finishes after the tab stays in the app for the settle time", async () => {
    expect(await nextPipStep(state({ outsideSince: 10_000 - SETTLE_MS }))).toBe("finished");
    expect(await nextPipStep(state({ outsideSince: 10_000 - SETTLE_MS + 1 }))).toBe("wait");
  });

  it("waits on a sign-in route without the button", async () => {
    const step = await nextPipStep(state({ pathname: "/auth/callback", outsideSince: 0 }));
    expect(step).toBe("wait");
  });
});

describe("findSignInButton layout cost", () => {
  it("measures only the buttons whose label matches", () => {
    document.body.innerHTML = `${"<button>Other</button>".repeat(20)}<button>Sign in with Microsoft</button>`;
    const measure = vi.spyOn(Element.prototype, "getBoundingClientRect");

    findSignInButton({ doc: document, clicked: new WeakSet<Element>() });
    expect(measure).toHaveBeenCalledTimes(1);
  });
});
