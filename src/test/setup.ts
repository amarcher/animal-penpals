import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import type { ReactNode, ElementType, ComponentPropsWithoutRef } from 'react';
import { createElement } from 'react';

// Mock framer-motion globally — render children without animations
vi.mock('framer-motion', () => {
  const motionHandler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop: string) {
      return function MotionComponent(props: ComponentPropsWithoutRef<'div'> & { children?: ReactNode }) {
        const htmlProps: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(props)) {
          if (
            !key.startsWith('animate') && !key.startsWith('initial') &&
            !key.startsWith('exit') && !key.startsWith('transition') &&
            !key.startsWith('variants') && !key.startsWith('while') &&
            key !== 'layout' && key !== 'layoutId'
          ) {
            htmlProps[key] = value;
          }
        }
        return createElement(prop as string, htmlProps);
      };
    },
  };

  return {
    motion: new Proxy({} as Record<string, ElementType>, motionHandler),
    AnimatePresence: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
    useAnimation: () => ({ start: () => Promise.resolve(), stop: () => {}, set: () => {} }),
    useMotionValue: (v: number) => ({ get: () => v, set: () => {} }),
  };
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  localStorage.clear();
});

// Mock matchMedia (not supported in happy-dom)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock HTMLMediaElement methods
HTMLMediaElement.prototype.play = async () => {};
HTMLMediaElement.prototype.pause = () => {};
HTMLMediaElement.prototype.load = () => {};

// Mock Audio constructor
window.Audio = class MockAudio extends Audio {
  constructor(src?: string) {
    super();
    if (src) this.src = src;
  }
} as typeof Audio;

// happy-dom doesn't fully implement URL.createObjectURL — stub it
if (!URL.createObjectURL || URL.createObjectURL.toString().includes('not implemented')) {
  let counter = 0;
  URL.createObjectURL = () => `blob:mock-${++counter}`;
  URL.revokeObjectURL = () => {};
}
