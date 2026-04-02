import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../renderWithRouter.tsx';

// Mock ElevenLabs voice agent (deeply tied to SDK + mic)
vi.mock('../../hooks/usePenpalConversation.ts', () => ({
  usePenpalConversation: () => ({
    agentId: null, // Hides VoiceAgent component
    status: 'off',
    isSpeaking: false,
    micError: null,
    toggle: vi.fn(),
    clearMicError: vi.fn(),
    notifyViewChange: vi.fn(),
    notifyDraftChange: vi.fn(),
    notifyLetterReceivedWithTts: vi.fn(),
    notifyLetterReceivedNoTts: vi.fn(),
    muteAgent: vi.fn(),
    unmuteAgent: vi.fn(),
  }),
}));

// Mock video preload cache
vi.mock('../../utils/videoPreloadCache.ts', () => ({
  preloadVideo: vi.fn(() => ({
    element: document.createElement('video'),
    ready: false,
    readyPromise: Promise.resolve(),
  })),
  getCachedVideo: vi.fn(() => null),
  evictVideo: vi.fn(),
}));

// Mock TTS prefetch cache
const mockPrefetchTts = vi.fn();
vi.mock('../../utils/ttsPrefetchCache.ts', () => ({
  prefetchTts: (...args: unknown[]) => mockPrefetchTts(...args),
  getCachedTts: vi.fn(() => undefined),
  evictTts: vi.fn(),
}));

// Mock useTtsPlayback
const mockTtsPlay = vi.fn().mockResolvedValue(false); // auto-play fails (mobile)
vi.mock('../../hooks/useTtsPlayback.ts', () => ({
  buildWordTimings: vi.fn(() => []),
  useTtsPlayback: () => ({
    isPlaying: false,
    isLoading: false,
    currentWordIndex: -1,
    wordTimings: [],
    play: mockTtsPlay,
    stop: vi.fn(),
  }),
}));

// Mock getAnimalVideo to prevent video path in ReceiveAnimation
vi.mock('../../data/videoManifest.ts', () => ({
  getAnimalVideo: vi.fn(() => undefined),
}));

// Mock Vercel Analytics
vi.mock('@vercel/analytics/react', () => ({
  Analytics: () => null,
}));

describe('Letter Flow Integration', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
    localStorage.clear();
    user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ response: 'Hello little friend! I love being an elephant!' }),
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('completes full mailbox → compose → send → receive → reading flow', async () => {
    renderWithRouter('/mailbox');

    // 1. Mailbox renders with all animals
    expect(screen.getByAltText('Animal Penpals')).toBeInTheDocument();
    expect(screen.getByLabelText('Write to Ella the Elephant')).toBeInTheDocument();

    // 2. Select an animal → compose view
    await user.click(screen.getByLabelText('Write to Ella the Elephant'));
    expect(screen.getByText('Dear Ella the Elephant,')).toBeInTheDocument();

    // 3. Type a letter
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Hello Ella! I love elephants!' } });

    // 4. Send the letter
    await user.click(screen.getByRole('button', { name: /send letter/i }));

    // 5. Verify API called with correct content
    expect(fetch).toHaveBeenCalledWith('/api/generate-response', expect.objectContaining({
      method: 'POST',
    }));
    const fetchBody = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(fetchBody.childLetter).toBe('Hello Ella! I love elephants!');
    expect(fetchBody.animalId).toBe('elephant');

    // 6. SendAnimation completes after 1500ms → transitions to receiving
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    // 7. ReceiveAnimation fallback progresses (6300ms total)
    await act(async () => {
      vi.advanceTimersByTime(6300);
    });

    // Let promises resolve
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // 8. Reading view shows the response
    expect(screen.getByText('From Ella the Elephant')).toBeInTheDocument();
  });

  it('thread history persists between sends', async () => {
    renderWithRouter('/mailbox');

    // First letter
    await user.click(screen.getByLabelText('Write to Ella the Elephant'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'First letter' } });
    await user.click(screen.getByRole('button', { name: /send letter/i }));

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    await act(async () => {
      vi.advanceTimersByTime(6300);
    });
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Should be in reading view, click "Write Back"
    await user.click(screen.getByRole('button', { name: /write back/i }));

    // Verify we're back in compose with thread history
    expect(screen.getByText('Dear Ella the Elephant,')).toBeInTheDocument();

    // Thread history should show previous letters
    expect(screen.getByText('First letter')).toBeInTheDocument();
  });

  it('unread badge appears for new animal response', async () => {
    renderWithRouter('/mailbox');

    // Send a letter to elephant
    await user.click(screen.getByLabelText('Write to Ella the Elephant'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hi Ella!' } });
    await user.click(screen.getByRole('button', { name: /send letter/i }));

    await act(async () => { vi.advanceTimersByTime(1500); });
    await act(async () => { vi.advanceTimersByTime(6300); });
    await act(async () => { await vi.runAllTimersAsync(); });

    // Go back to mailbox
    await user.click(screen.getByRole('button', { name: /back to mailbox/i }));

    // Should show "Continue writing" for elephant (has thread)
    expect(screen.getByAltText('Animal Penpals')).toBeInTheDocument();
  });
});
