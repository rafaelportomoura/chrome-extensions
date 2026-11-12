// Fallback content source: finds the attachment through Jira Cloud's REST API and downloads it
// with the user's own session (same origin).
import {
  type DisplayedSize,
  MAX_PREVIEW_BYTES,
  matchesDisplayedSize,
  parseDisplayedSize,
} from "./file-type";

/** A failure whose message is shown to the user on the toggle. */
export class PreviewError extends Error {}

export interface Attachment {
  id: string;
  filename: string;
  size: number;
  created: string;
}

/** The issue key from `/browse/KEY-1` or a `selectedIssue=KEY-1` parameter. */
export function issueKeyFromUrl(url: string): string | null {
  const parsed = new URL(url);
  const selected = parsed.searchParams.get("selectedIssue");
  if (selected && /^[A-Z][A-Z0-9_]*-\d+$/.test(selected)) return selected;
  const match = /\/browse\/([A-Z][A-Z0-9_]*-\d+)/.exec(parsed.pathname);
  return match?.[1] ?? null;
}

/** The attachment shown in the viewer: same name, a consistent size, the most recent on ties. */
export function pickAttachment(
  attachments: Attachment[],
  fileName: string,
  size: DisplayedSize | null,
): Attachment | null {
  const candidates = attachments
    .filter((a) => a.filename === fileName)
    .filter((a) => size === null || matchesDisplayedSize(a.size, size))
    .sort((a, b) => Date.parse(b.created) - Date.parse(a.created));
  return candidates[0] ?? null;
}

export interface RestSourceInput {
  pageUrl: string;
  fileName: string;
  sizeText: string;
  fetchFn?: typeof fetch;
}

async function getOk(fetchFn: typeof fetch, url: string): Promise<Response> {
  const response = await fetchFn(url, { credentials: "include" });
  if (!response.ok) throw new PreviewError(`Jira returned ${response.status}`);
  return response;
}

/** Downloads the text of the attachment shown in the viewer. */
export async function fetchAttachmentText(input: RestSourceInput): Promise<string> {
  const fetchFn = input.fetchFn ?? fetch;
  const key = issueKeyFromUrl(input.pageUrl);
  if (!key) throw new PreviewError("issue not found");
  const origin = new URL(input.pageUrl).origin;

  const issue = (await (
    await getOk(fetchFn, `${origin}/rest/api/3/issue/${key}?fields=attachment`)
  ).json()) as { fields?: { attachment?: Attachment[] } };
  const attachment = pickAttachment(
    issue.fields?.attachment ?? [],
    input.fileName,
    parseDisplayedSize(input.sizeText),
  );
  if (!attachment) throw new PreviewError("attachment not found");
  if (attachment.size > MAX_PREVIEW_BYTES) throw new PreviewError("file larger than 5 MB");

  const content = await getOk(
    fetchFn,
    `${origin}/rest/api/3/attachment/content/${attachment.id}?redirect=false`,
  );
  return content.text();
}
