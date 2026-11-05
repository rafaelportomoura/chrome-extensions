// Packages one extension for sharing: builds it, zips dist/ plus a filled-in INSTALL.md into
// ~/Downloads/<extension>-<version>.zip, then prints the chat message and copies it.
// Usage: pnpm zip <extension> [--lang pt-BR|en]
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative, sep } from "node:path";
import { zipSync } from "fflate";
import { copyToClipboard } from "./clipboard.ts";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALES,
  type Locale,
  type Package,
  renderInstall,
  renderMessage,
} from "./share.ts";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const EXTS_DIR = join(REPO_ROOT, "exts");
/** Docs that stay in the repo when a legacy extension is zipped from its own folder. */
const REPO_ONLY = new Set([
  "README.md",
  "GLOSSARY.md",
  "DESCRIPTION.md",
  "INSTALL.md",
  ".DS_Store",
]);

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv: string[]): { folder: string; locale: Locale } {
  const usage = `Usage: pnpm zip <extension> [--lang ${LOCALES.join("|")}]\nExtensions: ${readdirSync(EXTS_DIR).join(", ")}`;
  let folder: string | undefined;
  let locale: Locale = DEFAULT_LOCALE;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] ?? "";
    if (arg === "--lang" || arg.startsWith("--lang=")) {
      const value = arg === "--lang" ? argv[++i] : arg.slice("--lang=".length);
      if (!value || !isLocale(value)) fail(`Unknown language "${value ?? ""}".\n${usage}`);
      locale = value;
    } else if (!folder) {
      folder = arg.replace(/[/\\]+$/, "");
    } else {
      fail(usage);
    }
  }
  if (!folder) fail(usage);
  if (!existsSync(join(EXTS_DIR, folder))) fail(`Extension not found: exts/${folder}\n${usage}`);
  return { folder, locale };
}

function build(folder: string): string {
  const extensionDir = join(EXTS_DIR, folder);
  if (!existsSync(join(extensionDir, "package.json"))) return extensionDir;

  const result = spawnSync("pnpm", ["--filter", folder, "build"], {
    cwd: REPO_ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) fail(`Build failed for ${folder}`);
  return join(extensionDir, "dist");
}

function collectFiles(dir: string, skip: Set<string>): Record<string, Uint8Array> {
  const files: Record<string, Uint8Array> = {};
  const walk = (current: string): void => {
    for (const entry of readdirSync(current)) {
      const path = join(current, entry);
      if (statSync(path).isDirectory()) {
        walk(path);
      } else if (!skip.has(entry)) {
        files[relative(dir, path).split(sep).join("/")] = readFileSync(path);
      }
    }
  };
  walk(dir);
  return files;
}

function readOptional(path: string): string | undefined {
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
}

function main(): void {
  const { folder, locale } = parseArgs(process.argv.slice(2));
  const extensionDir = join(EXTS_DIR, folder);
  const sourceDir = build(folder);

  const manifest = JSON.parse(readFileSync(join(sourceDir, "manifest.json"), "utf8")) as {
    name: string;
    version: string;
  };
  const zip = `${folder}-${manifest.version}.zip`;
  const pkg: Package = { name: manifest.name, folder, version: manifest.version, zip };

  const description = readOptional(join(extensionDir, "DESCRIPTION.md"));
  if (!description) fail(`exts/${folder}/DESCRIPTION.md is missing`);
  const sources = {
    installTemplate: readFileSync(join(REPO_ROOT, "INSTALL.md"), "utf8"),
    messageTemplate: readFileSync(join(REPO_ROOT, "scripts", "MESSAGE.md"), "utf8"),
    description,
    extensionInstall: readOptional(join(extensionDir, "INSTALL.md")),
  };

  let install: string;
  let message: string;
  try {
    install = renderInstall(sources, pkg, locale);
    message = renderMessage(sources, pkg, locale);
  } catch (error) {
    fail((error as Error).message);
  }

  const files = collectFiles(
    sourceDir,
    sourceDir === extensionDir ? REPO_ONLY : new Set([".DS_Store"]),
  );
  files["INSTALL.md"] = new TextEncoder().encode(install);
  const output = join(homedir(), "Downloads", zip);
  writeFileSync(output, zipSync(files, { level: 9 }));

  console.log(`\nCreated ${output} (${locale})\n`);
  console.log(message);
  const tool = copyToClipboard(message);
  console.log(
    tool
      ? `Message copied to the clipboard (${tool}).`
      : "No clipboard tool found; copy the message above.",
  );
}

main();
