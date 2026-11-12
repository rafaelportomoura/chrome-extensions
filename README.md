# chrome-extensions

Personal Chrome extensions. Each one lives in its own folder under [`exts/`](exts/) and is installed
locally with Chrome's "Load unpacked"; none is published to the Chrome Web Store.

## Extensions

| Folder                                                          | Name                        | What it does                                                                                                           |
| --------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [`exts/gcp-auto-login`](exts/gcp-auto-login/)                   | GCP Auto login              | Clicks through the Google sign-in pages opened by `gcloud auth login` and `gcloud auth application-default login`.     |
| [`exts/pip-auto-login`](exts/pip-auto-login/)                   | PIP Auto login              | Signs in to PIP through Microsoft SSO: clicks "Sign in with Microsoft", picks the account, confirms "Stay signed in?". |
| [`exts/jira-attachment-preview`](exts/jira-attachment-preview/) | Attachment Preview for Jira | Renders HTML and Markdown attachments in the Jira Cloud attachment viewer instead of their source code.                |

Each extension folder has its own `README.md` (how it works, settings, limitations),
`GLOSSARY.md` and `DESCRIPTION.md` (what it is, for sharing).

## Install

Requires Node 24+ and pnpm.

```sh
pnpm install
pnpm build
```

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and pick `exts/<extension>/dist`.
3. After pulling changes, run `pnpm build` again and click the reload icon on the extension's card.

## Develop

```sh
pnpm --filter <extension> dev   # rebuild on every change
pnpm check                      # lint, format check, typecheck and unit tests
pnpm format                     # apply Biome formatting and safe fixes
```

## Share

```sh
pnpm zip <extension>             # Portuguese
pnpm zip <extension> --lang en   # English
```

This builds the extension and writes `~/Downloads/<extension>-<version>.zip` with an
`INSTALL.md` in the chosen language inside. It also prints a chat message describing the
extension and copies it to the clipboard: paste it in Slack or Teams and attach the zip.

## Contributing

Conventions for code, tooling, verification and commits live in [`AGENTS.md`](AGENTS.md).
Shared vocabulary lives in [`GLOSSARY.md`](GLOSSARY.md).
