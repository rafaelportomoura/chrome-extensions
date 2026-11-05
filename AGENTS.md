# AGENTS.md

Personal Chrome extensions, installed with "Load unpacked" and never published. Vocabulary lives
in `GLOSSARY.md` (repo-wide) and `exts/<extension>/GLOSSARY.md` (per extension): use those terms
in code, docs and commits.

## Layout

- Every extension is one self-contained folder under `exts/`, named in kebab-case. The repo root
  is reserved for repo-wide tooling and docs.
- Extensions share no code with each other; anything common is copied, not imported.
- Each extension folder carries a `README.md` (how it works, settings, limitations) and a
  `GLOSSARY.md`. Update both, and the extensions table in the root `README.md`, when an extension
  is added or its behaviour changes.

## Standard stack

Every extension follows it; `exts/gcp-auto-login` is the reference to copy when adding one.

- TypeScript in strict mode, Manifest V3.
- pnpm workspaces, one package per `exts/*` folder. Root config: `tsconfig.base.json`,
  `biome.json`; build-time dependencies live in each extension's own `package.json`.
- Each extension keeps entry points and modules in `src/`, files copied verbatim (manifest, HTML)
  in `static/`, and a `build.ts` that bundles every entry point with esbuild as a standalone IIFE
  into `dist/` (git-ignored). `dist/` is what gets loaded unpacked and zipped.
- Entry points stay thin wiring; logic lives in modules that take their inputs as arguments so
  the unit tests reach it without a browser.
- Vitest unit tests in `tests/` (jsdom, `chrome.*` replaced by an in-memory mock) for every
  behaviour change.
- Playwright end-to-end tests, loading the real extension, where an extension needs them.
- Biome for lint and format.

Root scripts: `pnpm check` runs lint, typecheck and tests across all extensions;
`pnpm format` applies Biome's fixes; `pnpm --filter <extension> dev` rebuilds on change.

## Legacy extensions

A legacy extension is plain JavaScript loaded straight from its folder, with no `package.json`.
None remain. Should one be added, small fixes stay in plain JavaScript and a substantial change
migrates it to the standard stack first, in its own commit.

## Security

- Request the narrowest `permissions`, `host_permissions` and content-script `matches` that work.
- Ship all code inside the extension: no remote scripts, no `eval` or `new Function`.
- Keep user settings in `chrome.storage.sync`, with defaults declared in one place per extension.
- Keep secrets, emails and personal data out of the code; they belong in settings.
- Automation that clicks through authentication or consent screens acts only inside a flow the
  user explicitly allowed (e.g. an allowlist of OAuth client IDs).

## Verification

1. Run `pnpm check` and `pnpm build`.
2. Reload the extension at `chrome://extensions`.
3. Reproduce the flow the change touches in a real browser.
4. Read the extension's console logs, filtered by its log prefix (e.g. `[gcloud-auto-login]`), in
   the page console for content scripts or the service worker inspector for the background.

A change is verified when the flow behaves as intended and the logs show no errors.

## Commits and versions

- Commit and push straight to `main`. This is a personal repo with one agent working at a time,
  so the work never needs a branch, worktree or pull request.
- Every push runs `.githooks/pre-push` (enabled by `pnpm install`): `pnpm audit` at moderate
  level, lint and unit tests. A red hook means fixing the cause, then pushing again; a moderate
  or worse advisory is fixed by upgrading or overriding the dependency.
- Commit and push every finished change without asking first. A change the user rejects is
  undone with a follow-up revert commit.
- Conventional Commits, scoped by the extension folder name: `feat(gcp-auto-login): ...`.
  Repo-wide changes use no scope.
- Bump `version` in the extension's `manifest.json` (semver) in any commit that changes its
  behaviour.

## Sharing

`pnpm zip <extension>` builds the extension and writes `~/Downloads/<extension>-<version>.zip`
from its `dist/` (a legacy extension is zipped from its folder).
