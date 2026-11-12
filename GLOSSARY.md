# Chrome Extensions

Personal Chrome extensions kept in one repository, each installed locally rather than through the
Chrome Web Store.

## Language

**Extension**:
One Chrome extension, living in its own folder under `exts/`.
_Avoid_: Plugin, add-on, app

**Legacy extension**:
An Extension that predates the standard stack and has not been migrated to it yet.
_Avoid_: Old extension, v0

**Settings**:
The user's preferences for one Extension, synced across their Chrome browsers.
_Avoid_: Config, options

**Unpacked install**:
Loading an Extension into Chrome from a local folder instead of from the Chrome Web Store.
_Avoid_: Sideload, dev install

## Contexts

- [GCP Auto login](exts/gcp-auto-login/GLOSSARY.md): signs in through the Google pages opened
  by the gcloud CLI
- [PIP Auto login](exts/pip-auto-login/GLOSSARY.md): signs in to PIP through Microsoft SSO
