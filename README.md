# chrome-extensions

Personal Chrome extensions. Each one lives in its own folder under [`exts/`](exts/) and is installed
locally with Chrome's "Load unpacked"; none is published to the Chrome Web Store.

## Extensions

| Folder | Name | What it does |
| --- | --- | --- |
| [`exts/gcp-auto-login`](exts/gcp-auto-login/) | gcloud Auto Login | Clicks through the Google sign-in pages opened by `gcloud auth login` and `gcloud auth application-default login`. |

Each extension folder has its own `README.md` (how it works, settings, limitations) and
`GLOSSARY.md`.

## Install

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and pick the extension folder: `exts/<extension>/dist` for TypeScript
   extensions, or `exts/<extension>` for legacy ones (no `dist/`).
3. After pulling changes, click the reload icon on the extension's card.

## Share

```sh
scripts/zip.sh <extension>
```

This writes `~/Downloads/<extension>-<version>.zip`, with the version read from the extension's
`manifest.json`. Whoever receives it unzips it and loads the folder with **Load unpacked**.

## Contributing

Conventions for code, tooling, verification and commits live in [`AGENTS.md`](AGENTS.md).
Shared vocabulary lives in [`GLOSSARY.md`](GLOSSARY.md).
