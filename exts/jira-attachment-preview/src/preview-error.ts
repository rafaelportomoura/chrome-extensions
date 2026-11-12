import { MAX_PREVIEW_BYTES } from "./file-type";

/** A reason the Preview cannot be shown, displayed to the user next to the toggle. */
export class PreviewError extends Error {}

export const TOO_LARGE_REASON = `file larger than ${MAX_PREVIEW_BYTES / 1024 ** 2} MB`;
