// Guards the real share sources: every extension renders in every locale.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LOCALES, renderInstall, renderMessage } from "../src/share.ts";

const ROOT = join(import.meta.dirname, "..", "..");
const read = (...parts: string[]) => readFileSync(join(ROOT, ...parts), "utf8");
const optional = (...parts: string[]) =>
  existsSync(join(ROOT, ...parts)) ? read(...parts) : undefined;

describe.each(readdirSync(join(ROOT, "exts")))("exts/%s", (folder) => {
  it.each(LOCALES)("renders INSTALL.md and the chat message in %s", (locale) => {
    const sources = {
      installTemplate: read("INSTALL.md"),
      messageTemplate: read("scripts", "MESSAGE.md"),
      description: read("exts", folder, "DESCRIPTION.md"),
      extensionInstall: optional("exts", folder, "INSTALL.md"),
    };
    const pkg = { name: "Name", folder, version: "0.0.0", zip: `${folder}-0.0.0.zip` };

    expect(renderInstall(sources, pkg, locale)).not.toMatch(/\{\{|^## /m);
    expect(renderMessage(sources, pkg, locale)).not.toMatch(/\{\{|^## /m);
  });
});
