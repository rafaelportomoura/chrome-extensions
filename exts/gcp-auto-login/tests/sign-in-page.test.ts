import { describe, expect, it, vi } from "vitest";
import { advance, type PageContext } from "../src/sign-in-page";

function page(html: string, preferredEmail = ""): PageContext {
  document.body.innerHTML = html;
  return { doc: document, preferredEmail, clicked: new WeakSet() };
}

function onClick(selector: string) {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`No element for ${selector}`);
  const spy = vi.fn();
  el.addEventListener("click", spy);
  return spy;
}

describe("account chooser", () => {
  const twoAccounts = `
    <div data-identifier="me@work.com"></div>
    <div data-identifier="me@home.com"></div>`;

  it("picks the preferred account, ignoring case", () => {
    const ctx = page(twoAccounts, "Me@Home.com");
    const home = onClick('[data-identifier="me@home.com"]');
    const work = onClick('[data-identifier="me@work.com"]');

    expect(advance(ctx)).toBe(true);
    expect(home).toHaveBeenCalledOnce();
    expect(work).not.toHaveBeenCalled();
  });

  it("picks the only account when there is no preferred account", () => {
    const ctx = page('<div data-email="me@work.com"></div>');
    const work = onClick("[data-email]");

    expect(advance(ctx)).toBe(true);
    expect(work).toHaveBeenCalledOnce();
  });

  it("leaves the choice to the user with several accounts and no preferred account", () => {
    const ctx = page(twoAccounts);
    expect(advance(ctx)).toBe(false);
  });

  it("never clicks the same account twice", () => {
    const ctx = page('<div data-email="me@work.com"></div>');
    const work = onClick("[data-email]");

    advance(ctx);
    advance(ctx);
    expect(work).toHaveBeenCalledOnce();
  });
});

describe("consent screen", () => {
  it("ticks Select all before clicking Continue", () => {
    const ctx = page(`
      <label><input type="checkbox" id="all" /> Select all</label>
      <button id="continue">Continue</button>`);
    const box = document.querySelector<HTMLInputElement>("#all");
    const button = onClick("#continue");

    expect(advance(ctx)).toBe(true);
    expect(box?.checked).toBe(true);
    expect(button).not.toHaveBeenCalled();

    expect(advance(ctx)).toBe(true);
    expect(button).toHaveBeenCalledOnce();
  });

  it("matches Portuguese labels and aria-labelled checkboxes", () => {
    const ctx = page(`
      <span id="lbl">Selecionar tudo</span>
      <div role="checkbox" aria-checked="false" aria-labelledby="lbl" id="all"></div>
      <div role="button" id="allow">Permitir</div>`);
    const box = onClick("#all");
    const allow = onClick("#allow");

    advance(ctx);
    advance(ctx);
    expect(box).toHaveBeenCalledOnce();
    expect(allow).toHaveBeenCalledOnce();
  });

  it("skips disabled and hidden buttons", () => {
    const ctx = page(`
      <button disabled>Continue</button>
      <div role="button" aria-disabled="true">Continue</div>
      <div hidden><button>Continue</button></div>
      <button>Cancel</button>`);
    expect(advance(ctx)).toBe(false);
  });
});
