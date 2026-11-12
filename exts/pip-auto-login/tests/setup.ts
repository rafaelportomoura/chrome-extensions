// jsdom has no layout: every element reports a zero-size box. Give elements a size so the
// visibility check passes, except those inside a [hidden] subtree.
import { afterEach, beforeEach, vi } from "vitest";
import { installChromeMock } from "./chrome-mock";

Element.prototype.getBoundingClientRect = function (this: Element) {
  const size = this.closest("[hidden]") ? 0 : 10;
  return DOMRect.fromRect({ width: size, height: size });
};
Element.prototype.scrollIntoView = () => {};

beforeEach(() => {
  installChromeMock();
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});
