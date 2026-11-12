export const LOG_PREFIX = "[pip-auto-login]";

export function log(...args: unknown[]): void {
  console.log(LOG_PREFIX, ...args);
}
