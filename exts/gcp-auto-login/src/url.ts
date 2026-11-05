/** Decodes a URL repeatedly, since Google nests the OAuth parameters in encoded redirects. */
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

export function hasAllowedClient(url: string, allowedClientIds: string[]): boolean {
  const decoded = fullyDecode(url);
  return allowedClientIds.some((id) => id !== "" && decoded.includes(id));
}
