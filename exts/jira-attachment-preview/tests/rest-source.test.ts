import { describe, expect, it, vi } from "vitest";
import { PreviewError } from "../src/preview-error";
import {
  type Attachment,
  fetchAttachmentText,
  issueKeyFromUrl,
  pickAttachment,
} from "../src/rest-source";

const SITE = "https://example.atlassian.net";

function attachment(overrides: Partial<Attachment>): Attachment {
  return {
    id: "1",
    filename: "proto.html",
    size: 13913,
    created: "2026-11-01T10:00:00.000-0300",
    ...overrides,
  };
}

function fakeFetch(attachments: Attachment[], body = "<p>hi</p>", contentStatus = 200) {
  return vi.fn(async (url: string | URL | Request) => {
    const href = String(url);
    if (href.includes("/rest/api/3/issue/")) {
      return new Response(JSON.stringify({ fields: { attachment: attachments } }));
    }
    return new Response(body, { status: contentStatus });
  }) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
}

describe("issueKeyFromUrl", () => {
  it("reads /browse/KEY", () => {
    expect(issueKeyFromUrl(`${SITE}/browse/SCRUM-2196`)).toBe("SCRUM-2196");
  });

  it("reads selectedIssue on boards", () => {
    expect(issueKeyFromUrl(`${SITE}/jira/software/projects/S/boards/1?selectedIssue=S-7`)).toBe(
      "S-7",
    );
  });

  it("returns null elsewhere", () => {
    expect(issueKeyFromUrl(`${SITE}/jira/your-work`)).toBeNull();
  });
});

describe("pickAttachment", () => {
  it("takes the most recent attachment with the same name and size", () => {
    const older = attachment({ id: "1", created: "2026-11-01T10:00:00.000-0300" });
    const newer = attachment({ id: "2", created: "2026-11-02T10:00:00.000-0300" });
    const other = attachment({ id: "3", created: "2026-11-03T10:00:00.000-0300", size: 90000 });
    const size = { bytes: 14 * 1024, unit: 1024 };
    expect(pickAttachment([older, newer, other], "proto.html", size)?.id).toBe("2");
  });

  it("ignores the size when the viewer shows none", () => {
    expect(pickAttachment([attachment({ size: 1 })], "proto.html", null)?.id).toBe("1");
  });
});

describe("fetchAttachmentText", () => {
  const input = { pageUrl: `${SITE}/browse/S-1`, fileName: "proto.html", sizeText: "html · 14 KB" };

  it("downloads the matching attachment without the CDN redirect", async () => {
    const fetchFn = fakeFetch([attachment({ id: "13247" })]);
    await expect(fetchAttachmentText({ ...input, fetchFn })).resolves.toBe("<p>hi</p>");
    expect(fetchFn).toHaveBeenCalledWith(
      `${SITE}/rest/api/3/attachment/content/13247?redirect=false`,
      { credentials: "include" },
    );
  });

  it("fails without an issue key", async () => {
    const fetchFn = fakeFetch([]);
    await expect(
      fetchAttachmentText({ ...input, pageUrl: `${SITE}/jira/your-work`, fetchFn }),
    ).rejects.toThrow(new PreviewError("issue not found"));
  });

  it("fails when no attachment matches", async () => {
    const fetchFn = fakeFetch([attachment({ filename: "other.html" })]);
    await expect(fetchAttachmentText({ ...input, fetchFn })).rejects.toThrow(
      "attachment not found",
    );
  });

  it("refuses files over 5 MB", async () => {
    const fetchFn = fakeFetch([attachment({ size: 6 * 1024 ** 2 })]);
    await expect(
      fetchAttachmentText({ ...input, sizeText: "html · 6 MB", fetchFn }),
    ).rejects.toThrow("file larger than 5 MB");
  });

  it("reports a Jira HTTP error", async () => {
    const fetchFn = fakeFetch([attachment({})], "", 403);
    await expect(fetchAttachmentText({ ...input, fetchFn })).rejects.toThrow("Jira returned 403");
  });
});
