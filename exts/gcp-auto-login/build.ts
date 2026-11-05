// Bundles each entry point into dist/ as a standalone script and copies static/ next to them.
// Usage: node build.ts [--watch]
import { cp, rm } from "node:fs/promises";
import { type BuildOptions, build, context } from "esbuild";

const OUT_DIR = "dist";

const options: BuildOptions = {
  entryPoints: ["src/background.ts", "src/content.ts", "src/success.ts", "src/options.ts"],
  bundle: true,
  format: "iife",
  target: "chrome120",
  outdir: OUT_DIR,
  logLevel: "info",
};

await rm(OUT_DIR, { recursive: true, force: true });
await cp("static", OUT_DIR, { recursive: true });

if (process.argv.includes("--watch")) {
  const ctx = await context(options);
  await ctx.watch();
} else {
  await build(options);
}
