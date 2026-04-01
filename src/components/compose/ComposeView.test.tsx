import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComposeView } from './ComposeView.tsx';

// Mock video preload to avoid DOM side effects
vi.mock('../../utils/videoPreloadCache.ts', () => ({
  preloadVideo: vi.fn(),
  getCachedVideo: vi.fn(),
  evictVideo: vi.fn(),
}));

describe('ComposeView', () => {
  const defaultProps = {
    animalId: 'elephant',
    onSend: vi.fn(),
    onBack: vi.fn(),
    onDraftChange: vi.fn(),
  };

  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
  });

  it('renders greeting with animal name', () => {
    render(<ComposeView {...defaultProps} />);
    expect(screen.getByText('Dear Ella the Elephant,')).toBeInTheDocument();
  });

  it('renders header with animal name', () => {
    render(<ComposeView {...defaultProps} />);
    expect(screen.getByText('Writing to Ella the Elephant')).toBeInTheDocument();
  });

  it('send button is disabled when textarea is empty', () => {
    render(<ComposeView {...defaultProps} />);
    expect(screen.getByRole('button', { name: /send letter/i })).toBeDisabled();
  });

  it('send button is enabled when text is entered', async () => {
    render(<ComposeView {...defaultProps} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello Ella!');
    expect(screen.getByRole('button', { name: /send letter/i })).toBeEnabled();
  });

  it('clicking send calls onSend with content', async () => {
    const onSend = vi.fn();
    render(<ComposeView {...defaultProps} onSend={onSend} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Hello Ella!' } });
    await user.click(screen.getByRole('button', { name: /send letter/i }));

    expect(onSend).toHaveBeenCalledWith('Hello Ella!');
  });

  it('back button calls onBack', async () => {
    const onBack = vi.fn();
    render(<ComposeView {...defaultProps} onBack={onBack} />);

    await user.click(screen.getByRole('button', { name: /back to mailbox/i }));
    expect(onBack).toHaveBeenCalled();
  });

  it('renders thread history', () => {
    const thread = {
      id: 'thread-1',
      animalId: 'elephant',
      letters: [
        { id: 'l1', threadId: 'thread-1', animalId: 'elephant', from: 'child' as const, content: 'Hi Ella!', timestamp: 1, read: true },
        { id: 'l2', threadId: 'thread-1', animalId: 'elephant', from: 'animal' as const, content: 'Hello friend!', timestamp: 2, read: true },
      ],
    };

    render(<ComposeView {...defaultProps} thread={thread} />);

    expect(screen.getByText('Hi Ella!')).toBeInTheDocument();
    expect(screen.getByText('Hello friend!')).toBeInTheDocument();
  });

  it('external text sets draft', () => {
    render(<ComposeView {...defaultProps} externalText={{ text: 'voice text', seq: 1 }} />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('voice text');
  });

  it('same seq number does not duplicate text', () => {
    const { rerender } = render(
      <ComposeView {...defaultProps} externalText={{ text: 'voice text', seq: 1 }} />
    );

    rerender(<ComposeView {...defaultProps} externalText={{ text: 'voice text', seq: 1 }} />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('voice text');
  });

  it('notifies draft changes on typing', async () => {
    const onDraftChange = vi.fn();
    render(<ComposeView {...defaultProps} onDraftChange={onDraftChange} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hi');

    expect(onDraftChange).toHaveBeenCalled();
  });
});
