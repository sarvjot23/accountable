import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup());

// The whole suite runs at once with coverage on, so a page can take a few seconds to settle.
configure({ asyncUtilTimeout: 5000 });

// From Node 24, Node's Request refuses jsdom's AbortSignal, which React Router passes on every
// navigation, so a click on a link or a popstate would throw. The tests never abort a navigation,
// so leave the signal out.
const NodeRequest = globalThis.Request;
globalThis.Request = class TestRequest extends NodeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, { ...init, signal: null });
  }
};

// jsdom lacks these, and Radix, cmdk and Recharts use them.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
Element.prototype.scrollIntoView ??= function scrollIntoView() {};
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})) as typeof window.matchMedia;
