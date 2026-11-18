// Guards the chrome.runtime calls of a content script. When the extension is reloaded or updated,
// the content script already injected in an open page loses its connection to it and
// `chrome.runtime` becomes undefined, until the page is reloaded.
import { PreviewError } from "./preview-error";

export const EXTENSION_RELOADED_REASON = "extension was reloaded: reload this page";

/** The extension's own runtime API, or a PreviewError when the content script is orphaned. */
export function extensionRuntime(chromeApi: typeof chrome = chrome): typeof chrome.runtime {
  if (!chromeApi.runtime?.id) throw new PreviewError(EXTENSION_RELOADED_REASON);
  return chromeApi.runtime;
}
