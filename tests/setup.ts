/**
 * Test setup file
 * Runs before each test suite
 */

import { vi } from 'vitest';

// Mock Chrome APIs
global.chrome = {
  runtime: {
    getURL: (path: string) => `chrome-extension://mock-extension-id/${path}`,
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    sendMessage: vi.fn(),
  },
  storage: {
    local: {
      get: vi.fn((_keys, callback) => {
        callback({});
      }),
      set: vi.fn((_items, callback) => {
        if (callback) callback();
      }),
      remove: vi.fn((_keys, callback) => {
        if (callback) callback();
      }),
    },
    sync: {
      get: vi.fn((_keys, callback) => {
        callback({});
      }),
      set: vi.fn((_items, callback) => {
        if (callback) callback();
      }),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
  },
} as any;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
} as any;

// Mock MutationObserver
global.MutationObserver = class MutationObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
} as any;

// Mock IndexedDB for testing
import 'fake-indexeddb/auto';
