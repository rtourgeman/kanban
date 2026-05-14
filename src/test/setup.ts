import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

document.documentElement.lang = 'he';
document.documentElement.dir = 'rtl';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false
  })
});
