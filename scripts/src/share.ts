// Renders the shareable INSTALL.md and chat message from the locale-sectioned Markdown files.
// Each source file holds one `## <locale>` section per locale; only that section is used.

export const LOCALES = ["pt-BR", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "pt-BR";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Returns the body under `## <locale>`, up to the next level-2 heading. */
export function localeSection(markdown: string, locale: Locale, source: string): string {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${locale}`);
  if (start === -1) throw new Error(`${source} has no "## ${locale}" section`);

  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("## "));
  const body = (end === -1 ? rest : rest.slice(0, end)).join("\n").trim();
  if (!body) throw new Error(`${source} has an empty "## ${locale}" section`);
  return body;
}

/** Replaces every `{{key}}`; fails on a key with no value so nothing ships half-filled. */
export function fillPlaceholders(
  template: string,
  values: Record<string, string>,
  source: string,
): string {
  const missing = new Set<string>();
  const filled = template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = values[key];
    if (value === undefined) {
      missing.add(key);
      return match;
    }
    return value;
  });
  if (missing.size > 0) {
    throw new Error(`${source} uses placeholders with no value: ${[...missing].join(", ")}`);
  }
  return `${filled.replace(/\n{3,}/g, "\n\n").trim()}\n`;
}

export interface ShareSources {
  /** Root INSTALL.md template. */
  installTemplate: string;
  /** scripts/MESSAGE.md template. */
  messageTemplate: string;
  /** exts/<extension>/DESCRIPTION.md. */
  description: string;
  /** exts/<extension>/INSTALL.md, when the extension has specific steps. */
  extensionInstall?: string;
}

export interface Package {
  name: string;
  folder: string;
  version: string;
  zip: string;
}

export function renderInstall(sources: ShareSources, pkg: Package, locale: Locale): string {
  const extensionSteps = sources.extensionInstall
    ? localeSection(sources.extensionInstall, locale, `exts/${pkg.folder}/INSTALL.md`)
    : "";
  return fillPlaceholders(
    localeSection(sources.installTemplate, locale, "INSTALL.md"),
    { ...placeholders(pkg), extension_steps: extensionSteps },
    "INSTALL.md",
  );
}

export function renderMessage(sources: ShareSources, pkg: Package, locale: Locale): string {
  return fillPlaceholders(
    localeSection(sources.messageTemplate, locale, "scripts/MESSAGE.md"),
    {
      ...placeholders(pkg),
      description: localeSection(sources.description, locale, `exts/${pkg.folder}/DESCRIPTION.md`),
    },
    "scripts/MESSAGE.md",
  );
}

function placeholders(pkg: Package): Record<string, string> {
  return { name: pkg.name, folder: pkg.folder, version: pkg.version, zip: pkg.zip };
}
