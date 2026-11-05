import { describe, expect, it } from "vitest";
import { clipboardCommands } from "../src/clipboard.ts";

const names = (platform: NodeJS.Platform, env: NodeJS.ProcessEnv = {}) =>
  clipboardCommands(platform, env).map((c) => c.command);

describe("clipboardCommands", () => {
  it("picks the native tool per platform", () => {
    expect(names("darwin")).toEqual(["pbcopy"]);
    expect(names("win32")).toEqual(["powershell.exe"]);
    expect(names("linux")).toEqual(["wl-copy", "xclip", "xsel"]);
  });

  it("tries the Windows clipboard first under WSL", () => {
    expect(names("linux", { WSL_DISTRO_NAME: "Ubuntu" })).toEqual([
      "powershell.exe",
      "wl-copy",
      "xclip",
      "xsel",
    ]);
  });
});
