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

The target for every extension. The tooling does not exist in the repo yet: the first extension
that adopts it scaffolds it at the root.

- TypeScript in strict mode, Manifest V3.
- pnpm workspaces, one package per `exts/*` folder.
- esbuild bundles each extension into `exts/<extension>/dist/` (git-ignored); `dist/` is what
  gets loaded unpacked and zipped.
- Vitest unit tests (jsdom, `chrome.*` mocked) for every behaviour change.
- Playwright end-to-end tests, loading the real extension, where an extension needs them.
- Biome for lint and format, one config at the root.

## Legacy extensions

`exts/gcp-auto-login` is legacy: plain JavaScript, no build, no tests, loaded straight from its
folder. Small fixes stay in plain JavaScript. A substantial change migrates the extension to the
standard stack first, in its own commit.

## Security

- Request the narrowest `permissions`, `host_permissions` and content-script `matches` that work.
- Ship all code inside the extension: no remote scripts, no `eval` or `new Function`.
- Keep user settings in `chrome.storage.sync`, with defaults declared in one place per extension.
- Keep secrets, emails and personal data out of the code; they belong in settings.
- Automation that clicks through authentication or consent screens acts only inside a flow the
  user explicitly allowed (e.g. an allowlist of OAuth client IDs).

## Verification

1. Run the unit tests (standard extensions).
2. Reload the extension at `chrome://extensions`.
3. Reproduce the flow the change touches in a real browser.
4. Read the extension's console logs, filtered by its log prefix (e.g. `[gcloud-auto-login]`), in
   the page console for content scripts or the service worker inspector for the background.

A change is verified when the flow behaves as intended and the logs show no errors.

## Commits and versions

- Commit and push straight to `main`. This is a personal repo with one agent working at a time,
  so the work never needs a branch, worktree or pull request.
- Commit and push every finished change without asking first. A change the user rejects is
  undone with a follow-up revert commit.
- Conventional Commits, scoped by the extension folder name: `feat(gcp-auto-login): ...`.
  Repo-wide changes use no scope.
- Bump `version` in the extension's `manifest.json` (semver) in any commit that changes its
  behaviour.

## Sharing

`scripts/zip.sh <extension>` writes `~/Downloads/<extension>-<version>.zip`, packaging `dist/`
when it exists and the extension folder otherwise.
