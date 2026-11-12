// Bundles each entry point into dist/ as a standalone script and copies static/ next to them.
// The preview page carries the Markdown renderer (Mermaid alone is several MB), so it is minified;
// the small scripts stay readable for the console.
// Usage: node build.ts [--watch]
import { cp, rm } from "node:fs/promises";
import { type BuildOptions, build, context } from "esbuild";

const OUT_DIR = "dist";

const common: BuildOptions = {
  bundle: true,
  format: "iife",
  target: "chrome120",
  outdir: OUT_DIR,
  logLevel: "info",
};

const builds: BuildOptions[] = [
  {
    ...common,
    entryPoints: ["src/content.ts", "src/page.ts", "src/background.ts", "src/tab.ts"],
  },
  { ...common, entryPoints: ["src/preview.ts"], minify: true },
];

await rm(OUT_DIR, { recursive: true, force: true });
await cp("static", OUT_DIR, { recursive: true });

if (process.argv.includes("--watch")) {
  for (const options of builds) await (await context(options)).watch();
} else {
  await Promise.all(builds.map((options) => build(options)));
}
