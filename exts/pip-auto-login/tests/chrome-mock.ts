// In-memory stand-in for the parts of the chrome.* API the extension uses.
import { vi } from "vitest";

type Store = Record<string, unknown>;

function storageArea(store: Store) {
  return {
    get: vi.fn(async (keys: string | Store) => {
      if (typeof keys === "string") return keys in store ? { [keys]: store[keys] } : {};
      return { ...keys, ...store };
    }),
    set: vi.fn(async (items: Store) => {
      Object.assign(store, items);
    }),
    remove: vi.fn(async (key: string) => {
      delete store[key];
    }),
  };
}

export function installChromeMock() {
  const chromeMock = {
    storage: { sync: storageArea({}), session: storageArea({}) },
    tabs: { remove: vi.fn(async () => {}) },
    runtime: { sendMessage: vi.fn(async () => undefined) },
  };
  vi.stubGlobal("chrome", chromeMock);
  return chromeMock;
}
