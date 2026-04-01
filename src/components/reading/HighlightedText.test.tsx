import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HighlightedText } from './HighlightedText.tsx';

describe('HighlightedText', () => {
  it('renders all words', () => {
    render(
      <HighlightedText
        text="Hello world friend"
        wordTimings={[]}
        currentWordIndex={-1}
        animalColor="#5BB5D5"
      />
    );

    expect(screen.getByText(/Hello/)).toBeInTheDocument();
    expect(screen.getByText(/world/)).toBeInTheDocument();
    expect(screen.getByText(/friend/)).toBeInTheDocument();
  });

  it('applies active class to current word', () => {
    const timings = [
      { word: 'Hello', startTime: 0, endTime: 0.5 },
      { word: 'world', startTime: 0.5, endTime: 1 },
    ];

    render(
      <HighlightedText
        text="Hello world"
        wordTimings={timings}
        currentWordIndex={1}
        animalColor="#5BB5D5"
      />
    );

    const words = document.querySelectorAll('.highlighted-text__word');
    expect(words[1]).toHaveClass('highlighted-text__word--active');
    expect(words[0]).not.toHaveClass('highlighted-text__word--active');
  });

  it('applies read class to words before current', () => {
    const timings = [
      { word: 'Hello', startTime: 0, endTime: 0.3 },
      { word: 'world', startTime: 0.3, endTime: 0.6 },
      { word: 'friend', startTime: 0.6, endTime: 1 },
    ];

    render(
      <HighlightedText
        text="Hello world friend"
        wordTimings={timings}
        currentWordIndex={2}
        animalColor="#5BB5D5"
      />
    );

    const words = document.querySelectorAll('.highlighted-text__word');
    expect(words[0]).toHaveClass('highlighted-text__word--read');
    expect(words[1]).toHaveClass('highlighted-text__word--read');
    expect(words[2]).toHaveClass('highlighted-text__word--active');
  });

  it('no highlights when no timings', () => {
    render(
      <HighlightedText
        text="Hello world"
        wordTimings={[]}
        currentWordIndex={0}
        animalColor="#5BB5D5"
      />
    );

    const words = document.querySelectorAll('.highlighted-text__word');
    for (const word of words) {
      expect(word).not.toHaveClass('highlighted-text__word--active');
      expect(word).not.toHaveClass('highlighted-text__word--read');
    }
  });

  it('handles empty text', () => {
    const { container } = render(
      <HighlightedText
        text=""
        wordTimings={[]}
        currentWordIndex={-1}
        animalColor="#5BB5D5"
      />
    );

    expect(container.querySelector('.highlighted-text')).toBeInTheDocument();
  });
});
