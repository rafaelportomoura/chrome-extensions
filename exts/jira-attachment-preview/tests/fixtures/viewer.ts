// Minimal copy of Jira Cloud's attachment viewer DOM (stable data-testid attributes only).

export function viewerHtml(fileName: string, metadata: string): string {
  return `
<div class="atlaskit-portal-container"><div class="atlaskit-portal"><div><div>
  <div data-testid="media-viewer-popup" role="dialog" aria-modal="true">
    <div data-testid="inactivity-detector-wrapper">
      <div class="header">
        <div>
          <span data-testid="media-viewer-file-type-icon"></span>
          <h1 data-testid="media-viewer-file-name">${fileName}</h1>
          <div data-testid="media-viewer-file-metadata-text">${metadata}</div>
        </div>
        <div class="actions">
          <button data-testid="media-viewer-download-button" type="button">Download</button>
          <button data-testid="media-viewer-close-button" type="button">Close</button>
        </div>
      </div>
      <div class="content"><div class="cm-editor"><div class="cm-content"></div></div></div>
      <button data-testid="media-viewer-navigation-next" type="button">Next</button>
    </div>
  </div>
</div></div></div></div>`;
}

export function openViewer(fileName = "proto.html", metadata = "html · 14 KB"): void {
  document.body.innerHTML = viewerHtml(fileName, metadata);
}

/** What Jira does on next/prev: swaps the file name and metadata in place. */
export function switchFile(fileName: string, metadata: string): void {
  const name = document.querySelector('[data-testid="media-viewer-file-name"]');
  const meta = document.querySelector('[data-testid="media-viewer-file-metadata-text"]');
  if (name) name.textContent = fileName;
  if (meta) meta.textContent = metadata;
}

export function closeViewer(): void {
  document.querySelector(".atlaskit-portal-container")?.remove();
}
