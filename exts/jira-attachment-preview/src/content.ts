// Content script on *.atlassian.net: adds the Preview to Jira's attachment viewer.
import { requestEditorText } from "./editor-source";
import { PreviewController } from "./preview-controller";
import { fetchAttachmentText } from "./rest-source";
import { watchViewer } from "./viewer";

const controller = new PreviewController({
  win: window,
  pageUrl: () => location.href,
  requestEditorText,
  fetchAttachmentText,
  previewUrl: chrome.runtime.getURL("preview.html"),
  sendMessage: (message) => chrome.runtime.sendMessage(message),
});

watchViewer(
  document,
  (file) => void controller.show(file),
  () => controller.isIntact(),
);
