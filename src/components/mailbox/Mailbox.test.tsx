import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Mailbox } from './Mailbox.tsx';
import { animals } from '../../data/animals.ts';

// Capture initial-prop values passed to motion.div so we can verify the
// staggered entrance animation runs only on the first mount.
const motionInitialProps: unknown[] = [];
vi.mock('framer-motion', async () => {
  const { createElement } = await import('react');
  return {
    motion: new Proxy({} as Record<string, unknown>, {
      get: () => function MotionComponent(props: Record<string, unknown> & { children?: unknown }) {
        motionInitialProps.push(props.initial);
        return createElement('div', null, props.children as never);
      },
    }),
    AnimatePresence: ({ children }: { children?: unknown }) => createElement('div', null, children as never),
    useAnimation: () => ({ start: () => Promise.resolve(), stop: () => {}, set: () => {} }),
    useMotionValue: (v: number) => ({ get: () => v, set: () => {} }),
  };
});

describe('Mailbox', () => {
  const defaultProps = {
    onSelectAnimal: vi.fn(),
    getUnreadCount: () => 0,
    hasThread: () => false,
  };

  it('renders all animal cards', () => {
    render(<Mailbox {...defaultProps} />);

    for (const animal of animals) {
      expect(screen.getByLabelText(`Write to ${animal.name}`)).toBeInTheDocument();
    }
  });

  it('renders title and subtitle', () => {
    render(<Mailbox {...defaultProps} />);

    expect(screen.getByAltText('Animal Penpals')).toBeInTheDocument();
    expect(screen.getByText('Pick an animal friend to write to!')).toBeInTheDocument();
  });

  it('clicking a card calls onSelectAnimal with correct id', async () => {
    const onSelectAnimal = vi.fn();
    render(<Mailbox {...defaultProps} onSelectAnimal={onSelectAnimal} />);

    await userEvent.click(screen.getByLabelText('Write to Ella the Elephant'));
    expect(onSelectAnimal).toHaveBeenCalledWith('elephant');
  });

  it('shows unread badge when count > 0', () => {
    const getUnreadCount = (id: string) => (id === 'dolphin' ? 3 : 0);
    render(<Mailbox {...defaultProps} getUnreadCount={getUnreadCount} />);

    expect(screen.getByLabelText('3 unread')).toBeInTheDocument();
  });

  it('shows "Continue writing" when hasThread returns true', () => {
    const hasThread = (id: string) => id === 'elephant';
    render(<Mailbox {...defaultProps} hasThread={hasThread} />);

    expect(screen.getByText('Continue writing')).toBeInTheDocument();
  });

  it('shows "Write a letter" when hasThread returns false', () => {
    render(<Mailbox {...defaultProps} />);

    const buttons = screen.getAllByText('Write a letter');
    expect(buttons.length).toBe(animals.length);
  });

  it('runs the staggered entrance animation on first mount, but skips it on later mounts', async () => {
    // The "first mount played" flag is module-level, so reset to get a clean
    // first-mount run regardless of what other tests did before this one.
    vi.resetModules();
    const { Mailbox: FreshMailbox } = await import('./Mailbox.tsx');

    motionInitialProps.length = 0;

    const first = render(<FreshMailbox {...defaultProps} />);
    // First mount: every card animates in from opacity 0
    expect(motionInitialProps.length).toBe(animals.length);
    expect(motionInitialProps.every(v => typeof v === 'object' && v !== null && (v as { opacity?: number }).opacity === 0)).toBe(true);

    first.unmount();
    motionInitialProps.length = 0;

    render(<FreshMailbox {...defaultProps} />);
    // Second mount (e.g. returning from compose): no entrance — `initial: false`
    // tells framer-motion to render at the current animate value immediately.
    expect(motionInitialProps.length).toBe(animals.length);
    expect(motionInitialProps.every(v => v === false)).toBe(true);
  });
});
