import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReadingView } from './ReadingView.tsx';

// Mock useTtsPlayback
const mockPlay = vi.fn().mockResolvedValue(true);
const mockStop = vi.fn();
const mockPause = vi.fn();
const mockResume = vi.fn();
const mockTtsState = {
  isPlaying: false,
  isPaused: false,
  isLoading: false,
};
vi.mock('../../hooks/useTtsPlayback.ts', () => ({
  buildWordTimings: vi.fn(() => []),
  useTtsPlayback: () => ({
    ...mockTtsState,
    currentWordIndex: -1,
    wordTimings: [],
    play: mockPlay,
    pause: mockPause,
    resume: mockResume,
    stop: mockStop,
  }),
}));

describe('ReadingView', () => {
  const defaultProps = {
    animalId: 'dolphin',
    letterContent: 'Hello friend! I love swimming with dolphins.',
    onReply: vi.fn(),
    onBack: vi.fn(),
    onMarkRead: vi.fn(),
    onTtsAutoPlayStarted: vi.fn(),
    onTtsAutoPlayFailed: vi.fn(),
    onTtsEnd: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTtsState.isPlaying = false;
    mockTtsState.isPaused = false;
    mockTtsState.isLoading = false;
  });

  it('renders letter content', () => {
    const { container } = render(<ReadingView {...defaultProps} />);
    // Text is rendered character-by-character by HighlightedText
    expect(container.textContent).toContain('Hello friend');
    expect(container.textContent).toContain('swimming');
  });

  it('renders animal name in header', () => {
    render(<ReadingView {...defaultProps} />);
    expect(screen.getByText('From Deena the Dolphin')).toBeInTheDocument();
  });

  it('calls onMarkRead on mount', () => {
    render(<ReadingView {...defaultProps} />);
    expect(defaultProps.onMarkRead).toHaveBeenCalledTimes(1);
  });

  it('attempts TTS auto-play on mount', () => {
    render(<ReadingView {...defaultProps} />);
    expect(mockPlay).toHaveBeenCalledWith(
      defaultProps.letterContent,
      expect.any(String), // voiceId
    );
  });

  it('shows "Read aloud" button when not playing', () => {
    render(<ReadingView {...defaultProps} />);
    expect(screen.getByRole('button', { name: /read aloud/i })).toBeInTheDocument();
  });

  it('clicking "Read aloud" triggers TTS play', async () => {
    render(<ReadingView {...defaultProps} />);

    mockPlay.mockClear();
    await userEvent.click(screen.getByRole('button', { name: /read aloud/i }));
    expect(mockPlay).toHaveBeenCalled();
  });

  it('shows "Pause" while playing and pauses in place (no reset)', async () => {
    mockTtsState.isPlaying = true;
    render(<ReadingView {...defaultProps} />);

    await userEvent.click(screen.getByRole('button', { name: /pause/i }));
    expect(mockPause).toHaveBeenCalled();
    expect(mockStop).not.toHaveBeenCalled(); // stop only fires on unmount cleanup
  });

  it('shows "Keep reading" while paused and resumes', async () => {
    mockTtsState.isPaused = true;
    render(<ReadingView {...defaultProps} />);

    mockPlay.mockClear();
    await userEvent.click(screen.getByRole('button', { name: /keep reading/i }));
    expect(mockResume).toHaveBeenCalled();
    expect(mockPlay).not.toHaveBeenCalled(); // resume continues, not restart
  });

  it('reply button calls onReply', async () => {
    const onReply = vi.fn();
    render(<ReadingView {...defaultProps} onReply={onReply} />);

    await userEvent.click(screen.getByRole('button', { name: /write back/i }));
    expect(onReply).toHaveBeenCalled();
  });

  it('mailbox button calls onBack', async () => {
    const onBack = vi.fn();
    render(<ReadingView {...defaultProps} onBack={onBack} />);

    await userEvent.click(screen.getByRole('button', { name: /back to mailbox/i }));
    expect(onBack).toHaveBeenCalled();
  });
});
