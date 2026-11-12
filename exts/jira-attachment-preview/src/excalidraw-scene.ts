// Reads an Excalidraw file: the scene it stores, or null when the text is not one. Runs both in the
// content script (to keep Jira's Source view for an invalid file) and in the Excalidraw page.

export const INVALID_EXCALIDRAW_REASON = "not a valid Excalidraw file";

/** The parts of an `.excalidraw` file the Preview draws. */
export interface Scene {
  /** The drawing's elements, deleted ones left out. */
  elements: Record<string, unknown>[];
  appState: { viewBackgroundColor?: string };
  /** Embedded images by file id. */
  files: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The scene of an Excalidraw file's text; null when it is not JSON with `type: "excalidraw"`. */
export function parseScene(text: string): Scene | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isRecord(data) || data.type !== "excalidraw" || !Array.isArray(data.elements)) return null;
  const elements = data.elements.filter(
    (element): element is Record<string, unknown> =>
      isRecord(element) && element.isDeleted !== true,
  );
  const background = isRecord(data.appState) ? data.appState.viewBackgroundColor : undefined;
  return {
    elements,
    appState: typeof background === "string" ? { viewBackgroundColor: background } : {},
    files: isRecord(data.files) ? data.files : {},
  };
}
