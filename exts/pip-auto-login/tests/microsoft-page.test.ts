import { describe, expect, it, vi } from "vitest";
import { advance, type PageContext } from "../src/microsoft-page";

function page(html: string, preferredAccount = ""): PageContext {
  document.body.innerHTML = html;
  return { doc: document, preferredAccount, clicked: new WeakSet() };
}

function onClick(selector: string) {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`No element for ${selector}`);
  const spy = vi.fn();
  el.addEventListener("click", spy);
  return spy;
}

const tile = (email: string) => `
  <div role="listitem" class="row tile">
    <div role="button" class="table" data-test-id="${email}">${email} Entrou</div>
    <div role="button" data-test-id="${email}-menu-dots"></div>
  </div>`;

// Accounts as shown on PIP's "Escolha uma conta" page.
const PATRIA = "rafael.porto.consult@patria.com";
const CLIMBEE = "rafael.moura@climbee.com";
const chooser = `${tile(PATRIA)}${tile(CLIMBEE)}
  <div role="button" data-test-id="otherTile">Use outra conta</div>`;

describe("account chooser", () => {
  it("picks the only account in the preferred @domain, not its menu button", () => {
    const ctx = page(chooser, "@patria.com");
    const patria = onClick(`[data-test-id="${PATRIA}"]`);
    const menu = onClick(`[data-test-id="${PATRIA}-menu-dots"]`);
    const climbee = onClick(`[data-test-id="${CLIMBEE}"]`);

    expect(advance(ctx)).toBe(true);
    expect(patria).toHaveBeenCalledOnce();
    expect(menu).not.toHaveBeenCalled();
    expect(climbee).not.toHaveBeenCalled();
  });

  it("picks the preferred email, ignoring case", () => {
    const ctx = page(chooser, "Rafael.Moura@Climbee.com");
    const climbee = onClick(`[data-test-id="${CLIMBEE}"]`);

    expect(advance(ctx)).toBe(true);
    expect(climbee).toHaveBeenCalledOnce();
  });

  it("leaves the choice to the user when several accounts match the @domain", () => {
    const ctx = page(`${chooser}${tile("other@patria.com")}`, "@patria.com");
    expect(advance(ctx)).toBe(false);
  });

  it("does not take a subdomain account for the @domain", () => {
    const ctx = page(tile("me@x-patria.com"), "@patria.com");
    expect(advance(ctx)).toBe(false);
  });

  it("leaves the choice to the user when nothing matches", () => {
    const ctx = page(chooser, "nobody@patria.com");
    expect(advance(ctx)).toBe(false);
  });

  it("picks the only account when there is no preference", () => {
    const ctx = page(tile(CLIMBEE));
    const climbee = onClick(`[data-test-id="${CLIMBEE}"]`);

    expect(advance(ctx)).toBe(true);
    expect(climbee).toHaveBeenCalledOnce();
  });

  it("leaves the choice to the user with several accounts and no preference", () => {
    expect(advance(page(chooser))).toBe(false);
  });

  it("never clicks the same account twice", () => {
    const ctx = page(chooser, "@patria.com");
    const patria = onClick(`[data-test-id="${PATRIA}"]`);

    advance(ctx);
    advance(ctx);
    expect(patria).toHaveBeenCalledOnce();
  });
});

describe("stay signed in", () => {
  it("answers Yes on the classic KMSI page", () => {
    const ctx = page(`
      <div role="heading" id="kmsiTitle">Stay signed in?</div>
      <input type="checkbox" name="DontShowAgain" id="KmsiCheckboxField" />
      <input type="button" id="idBtn_Back" value="No" />
      <input type="submit" id="idSIButton9" value="Yes" />`);
    const yes = onClick("#idSIButton9");
    const no = onClick("#idBtn_Back");

    expect(advance(ctx)).toBe(true);
    expect(yes).toHaveBeenCalledOnce();
    expect(no).not.toHaveBeenCalled();
  });

  it("answers Sim on the Portuguese page found by its title", () => {
    const ctx = page(`
      <h1>Continuar conectado?</h1>
      <button id="no">Não</button>
      <button id="yes">Sim</button>`);
    const yes = onClick("#yes");

    expect(advance(ctx)).toBe(true);
    expect(yes).toHaveBeenCalledOnce();
  });

  it("does not click Yes outside the stay-signed-in page", () => {
    const ctx = page('<h1>Some question</h1><button id="yes">Yes</button>');
    expect(advance(ctx)).toBe(false);
  });

  it("leaves the consent page to the user", () => {
    const ctx = page(`
      <div role="heading">Permissions requested</div>
      <input type="button" value="Cancel" />
      <input type="submit" id="idSIButton9" value="Accept" />`);
    expect(advance(ctx)).toBe(false);
  });
});
