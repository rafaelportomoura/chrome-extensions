import type { Settings } from "./settings";

/** Decodes a URL repeatedly, since sign-in parameters can sit in encoded redirects. */
export function fullyDecode(value: string): string {
  let current = value;
  for (let i = 0; i < 5; i++) {
    let next: string;
    try {
      next = decodeURIComponent(current);
    } catch {
      break;
    }
    if (next === current) break;
    current = next;
  }
  return current;
}

/**
 * Whether a Microsoft SSO URL belongs to an allowed sign-in: it carries the configured tenant
 * and, with the client ID filter on, one of the allowed client IDs.
 */
export function isAllowedSignIn(
  url: string,
  settings: Pick<Settings, "tenantId" | "filterByClientId" | "allowedClientIds">,
): boolean {
  const decoded = fullyDecode(url).toLowerCase();
  const tenant = settings.tenantId.trim().toLowerCase();
  if (tenant === "" || !decoded.includes(tenant)) return false;
  if (!settings.filterByClientId) return true;
  return settings.allowedClientIds
    .map((id) => id.trim().toLowerCase())
    .some((id) => id !== "" && decoded.includes(id));
}
