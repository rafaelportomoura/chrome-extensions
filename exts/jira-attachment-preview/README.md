# Attachment Preview for Jira

Jira Cloud's attachment viewer shows HTML and Markdown attachments as source code. This extension
renders them in place: open the attachment and its Preview replaces the Source view, with a
"Preview / Source" toggle and an "Open in new tab" button next to the download button.

Built with `pnpm --filter jira-attachment-preview build`; load
`exts/jira-attachment-preview/dist` with **Load unpacked**.

## Code map

| File                                                             | Role                                                                              |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `src/content.ts`, `src/preview-controller.ts`                    | Content script: watches the viewer, loads the file, frames the Preview, toggle.   |
| `src/viewer.ts`                                                  | Attachment viewer DOM: file name and size, controls, Preview host, cleanup.       |
| `src/page.ts`, `src/editor-source.ts`                            | Page-world script that hands the viewer editor's full text to the content script. |
| `src/rest-source.ts`                                             | Fallback: finds and downloads the attachment through Jira's REST API.             |
| `src/file-type.ts`                                               | Supported extensions, displayed-size parsing, the 5 MB limit.                     |
| `src/selectors.ts`                                               | Jira attachment viewer selectors shared by both worlds.                           |
| `src/preview.ts`, `src/preview-render.ts`, `static/preview.html` | Sandbox page that renders one Preview.                                            |
| `src/markdown.ts`, `static/preview.css`                          | Markdown to sanitised HTML, code highlighting, Mermaid diagrams, light/dark.      |
| `src/front-matter.ts`                                            | Splits YAML front matter off a Markdown file.                                     |
| `src/messages.ts`                                                | Messages between the scripts and pages; frames the preview page.                  |
| `src/background.ts`, `src/snapshot.ts`                           | Background worker: stores a snapshot and opens the new-tab page.                  |
| `src/tab.ts`, `src/tab-page.ts`, `static/tab.html`               | New-tab page: shows a snapshot, or says it expired.                               |

## How it works

1. The content script watches Jira pages on `*.atlassian.net` for the attachment viewer. When it
   shows a file whose name ends in `.html`, `.htm`, `.md` or `.markdown` (any case), it adds the
   controls and starts loading from a content source. Other files are left alone; SVG is
   already rendered by Jira.
2. The content comes from the viewer's own code editor: Jira keeps the whole file in memory but
   draws only the visible lines, so a page-world script reads it and posts it back. When the
   viewer shows no editor, the extension finds the attachment through
   `GET /rest/api/3/issue/{key}?fields=attachment` (same name, matching size, most recent on a
   tie) and downloads it with `/rest/api/3/attachment/content/{id}?redirect=false`, using the
   user's own Jira session.
3. The Preview is the extension's sandbox page `preview.html`, framed over the viewer's content:
   - HTML replaces the page and runs with its scripts, in an opaque origin with no access to the
     Jira page, its cookies or the session;
   - Markdown is rendered as GitHub-flavoured Markdown with highlighted code blocks and Mermaid
     diagrams. A YAML front matter block (`---` at the top) shows as a key/value table, or as
     highlighted YAML when it is nested, all bundled in the extension. Embedded HTML is sanitised with DOMPurify, so only
     the renderer runs scripts. It follows Jira's light or dark theme.
4. "Source" hides the Preview and shows Jira's view unchanged. "Open in new tab" stores a
   snapshot in `chrome.storage.session` and opens it in an extension page.
5. If the file cannot be loaded or is larger than 5 MB, Jira's Source view stays and the reason
   shows next to the download button.

Every step is logged to the page console with the `[jira-attachment-preview]` prefix.

## Permissions

| Permission                           | Why                                                                     |
| ------------------------------------ | ----------------------------------------------------------------------- |
| `storage`                            | Holds the new-tab snapshot in session storage until the browser closes. |
| Content scripts on `*.atlassian.net` | Reads the attachment viewer; the REST fallback calls the same site.     |

Nothing leaves the browser: the file is read from the page or from the same Jira site.

## Limitations

- Jira Cloud only (`*.atlassian.net`); not Jira Data Center/Server or Confluence.
- Relative URLs inside a file (`img/logo.png`, `style.css`) do not resolve; absolute URLs load.
- The Preview's sandbox page allows inline scripts, `eval` and remote `https:` scripts. This is
  a deliberate exception to the repo's "no remote scripts, no eval" rule, which covers the
  extension's own code: here the scripts are the attachment's, so prototypes that load libraries
  from a CDN or compile code in the browser work, and Mermaid's bundled CSV parser needs
  `new Function`. All of it runs in an opaque origin with no access to Jira or the extension.
  Forms and popups are blocked.
- Right after switching files the viewer's editor may still hold the previous file. The extension
  waits for its text to change and falls back to REST if it does not, or if its size is more than
  one unit away from the size Jira shows (e.g. "14 KB" accepts 13–15 KB).
- Reading the editor depends on a Jira internal (CodeMirror's `cmView`); if Jira changes it, the
  REST fallback takes over.
- The new-tab Preview is a snapshot and expires when the browser closes.
