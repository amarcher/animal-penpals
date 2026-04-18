import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { AnimalCard } from './AnimalCard.tsx';
import type { Animal } from '../../types/app.ts';

const bear: Animal = {
  id: 'bear',
  name: 'Bruno the Bear',
  species: 'Brown Bear',
  emoji: '\u{1F43B}',
  personality: 'warm',
  color: '#8B5E3C',
  voiceId: 'test',
  greeting: 'hi',
  traits: [],
};

type IOCallback = (entries: Array<{ isIntersecting: boolean }>) => void;

let ioCallbacks: IOCallback[] = [];

function triggerIntersection(isIntersecting: boolean) {
  act(() => {
    for (const cb of ioCallbacks) cb([{ isIntersecting }]);
  });
}

beforeEach(() => {
  ioCallbacks = [];
  class MockIntersectionObserver {
    constructor(cb: IOCallback) {
      ioCallbacks.push(cb);
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AnimalCard video lazy-mount', () => {
  const defaultProps = {
    animal: bear,
    unreadCount: 0,
    hasThread: false,
    onClick: vi.fn(),
  };

  it('renders poster image before the card is near the viewport', () => {
    render(<AnimalCard {...defaultProps} />);

    expect(screen.getByAltText('Bruno the Bear')).toBeInTheDocument();
    expect(screen.queryByLabelText('Bruno the Bear')).not.toBeInTheDocument();
  });

  it('mounts the video once the card enters the viewport', () => {
    const { container } = render(<AnimalCard {...defaultProps} />);
    triggerIntersection(true);

    expect(container.querySelector('video')).toBeInTheDocument();
    expect(screen.queryByAltText('Bruno the Bear')).not.toBeInTheDocument();
  });

  it('keeps the video mounted after the card leaves the viewport', () => {
    const { container } = render(<AnimalCard {...defaultProps} />);

    triggerIntersection(true);
    const videoOnEnter = container.querySelector('video');
    expect(videoOnEnter).toBeInTheDocument();

    triggerIntersection(false);
    const videoAfterLeave = container.querySelector('video');
    expect(videoAfterLeave).toBeInTheDocument();
    // Same element — never unmounted.
    expect(videoAfterLeave).toBe(videoOnEnter);
    // Poster image is not re-rendered alongside the video.
    expect(screen.queryByAltText('Bruno the Bear')).not.toBeInTheDocument();
  });

  it('pauses the video when it leaves the viewport and plays when it returns', () => {
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    const pauseSpy = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});

    render(<AnimalCard {...defaultProps} />);

    triggerIntersection(true);
    expect(playSpy).toHaveBeenCalled();

    triggerIntersection(false);
    expect(pauseSpy).toHaveBeenCalled();

    playSpy.mockClear();
    triggerIntersection(true);
    expect(playSpy).toHaveBeenCalled();

    playSpy.mockRestore();
    pauseSpy.mockRestore();
  });
});
