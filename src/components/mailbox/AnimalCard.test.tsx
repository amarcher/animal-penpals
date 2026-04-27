import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render } from '@testing-library/react';
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

describe('AnimalCard video lazy-load', () => {
  const defaultProps = {
    animal: bear,
    unreadCount: 0,
    hasThread: false,
    onClick: vi.fn(),
  };

  it('always renders the video element with a poster, even before the card is near the viewport', () => {
    const { container } = render(<AnimalCard {...defaultProps} />);

    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video?.getAttribute('poster')).toMatch(/bear_idle\.jpg$/);
    // src is not assigned until the card approaches the viewport
    expect(video?.getAttribute('src')).toBeNull();
  });

  it('assigns video src once the card enters the viewport', () => {
    const { container } = render(<AnimalCard {...defaultProps} />);
    triggerIntersection(true);

    const video = container.querySelector('video');
    expect(video?.getAttribute('src')).toMatch(/bear_idle\.mp4$/);
  });

  it('keeps the same video element after the card leaves the viewport (no re-mount, no src removal)', () => {
    const { container } = render(<AnimalCard {...defaultProps} />);

    triggerIntersection(true);
    const videoOnEnter = container.querySelector('video');
    const srcOnEnter = videoOnEnter?.getAttribute('src');

    triggerIntersection(false);
    const videoAfterLeave = container.querySelector('video');

    expect(videoAfterLeave).toBe(videoOnEnter);
    expect(videoAfterLeave?.getAttribute('src')).toBe(srcOnEnter);
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

  it('preassigns src when given a viewTransitionName (selected animal returning from compose)', () => {
    const { container } = render(<AnimalCard {...defaultProps} viewTransitionName="animal-video" />);
    // Without waiting for IntersectionObserver, src should already be set so
    // the video can keep playing as the morph lands.
    const video = container.querySelector('video');
    expect(video?.getAttribute('src')).toMatch(/bear_idle\.mp4$/);
  });
});
