// In-memory stand-in for the parts of the chrome.* API the extension uses.
import { vi } from "vitest";

type Store = Record<string, unknown>;

function storageArea(store: Store) {
  return {
    get: vi.fn(async (keys: string | Store | null) => {
      if (keys === null) return { ...store };
      if (typeof keys === "string") return keys in store ? { [keys]: store[keys] } : {};
      return { ...keys, ...store };
    }),
    set: vi.fn(async (items: Store) => {
      Object.assign(store, items);
    }),
    remove: vi.fn(async (keys: string | string[]) => {
      for (const key of Array.isArray(keys) ? keys : [keys]) delete store[key];
    }),
  };
}

export function installChromeMock() {
  const chromeMock = {
    storage: { session: storageArea({}) },
    tabs: { create: vi.fn(async () => ({})) },
    runtime: {
      sendMessage: vi.fn(async () => undefined),
      getURL: vi.fn((path: string) => `chrome-extension://test-id/${path}`),
      onMessage: { addListener: vi.fn() },
    },
  };
  vi.stubGlobal("chrome", chromeMock);
  return chromeMock;
}
