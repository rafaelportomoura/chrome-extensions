import { afterEach, beforeEach, vi } from "vitest";
import { installChromeMock } from "./chrome-mock";

beforeEach(() => {
  installChromeMock();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
  document.documentElement.removeAttribute("data-color-mode");
});
