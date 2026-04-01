import type { ReactNode, ComponentPropsWithoutRef, ElementType } from 'react';

function createMotionProxy() {
  return new Proxy({} as Record<string, ElementType>, {
    get(_target, prop: string) {
      return function MotionComponent({ children, ...rest }: ComponentPropsWithoutRef<'div'> & { children?: ReactNode }) {
        // Strip framer-motion-specific props
        const htmlProps: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(rest)) {
          if (
            !key.startsWith('animate') &&
            !key.startsWith('initial') &&
            !key.startsWith('exit') &&
            !key.startsWith('transition') &&
            !key.startsWith('variants') &&
            !key.startsWith('whileHover') &&
            !key.startsWith('whileTap') &&
            !key.startsWith('whileFocus') &&
            !key.startsWith('whileDrag') &&
            !key.startsWith('whileInView') &&
            key !== 'layout' &&
            key !== 'layoutId'
          ) {
            htmlProps[key] = value;
          }
        }
        const Tag = prop as ElementType;
        return <Tag data-testid={`motion-${prop}`} {...htmlProps}>{children}</Tag>;
      };
    },
  });
}

export const motion = createMotionProxy();

export function AnimatePresence({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export function useAnimation() {
  return {
    start: () => Promise.resolve(),
    stop: () => {},
    set: () => {},
  };
}

export function useMotionValue(initial: number) {
  return { get: () => initial, set: () => {} };
}
