// MAIN-world entry on *.atlassian.net: serves the viewer's editor text to the content script.
import { installEditorResponder } from "./editor-source";

installEditorResponder(window);
