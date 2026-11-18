// Content script on *.atlassian.net: adds the Preview to Jira's attachment viewer.
import { requestEditorText } from "./editor-source";
import { extensionRuntime } from "./extension-context";
import { previewPage } from "./file-type";
import { log } from "./log";
import { PreviewController } from "./preview-controller";
import { fetchAttachmentText } from "./rest-source";
import { watchViewer } from "./viewer";

const controller = new PreviewController({
  win: window,
  pageUrl: () => location.href,
  requestEditorText,
  fetchAttachmentText,
  previewUrl: (kind) => extensionRuntime().getURL(previewPage(kind)),
  sendMessage: (message) => extensionRuntime().sendMessage(message),
});

watchViewer(
  document,
  (file) => void controller.show(file),
  () => controller.isIntact(),
);

document.addEventListener("visibilitychange", () => log("page is now", document.visibilityState));
