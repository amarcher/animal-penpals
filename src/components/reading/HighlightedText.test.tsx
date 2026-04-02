import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HighlightedText } from './HighlightedText.tsx';

describe('HighlightedText', () => {
  const defaultProps = {
    wordTimings: [],
    currentWordIndex: -1,
    currentCharIndex: -1,
    animalColor: '#5BB5D5',
  };

  it('renders the full text', () => {
    const { container } = render(<HighlightedText {...defaultProps} text="Hello world friend" />);
    expect(container.textContent).toContain('Hello world friend');
  });

  it('strips audio tags from displayed text', () => {
    const { container } = render(
      <HighlightedText {...defaultProps} text="Hello! [laughs] I love swimming! [whispers] Secret time." />
    );
    expect(container.textContent).toContain('Hello! I love swimming! Secret time.');
    expect(container.textContent).not.toContain('[laughs]');
    expect(container.textContent).not.toContain('[whispers]');
  });

  it('applies read class to characters before current', () => {
    render(<HighlightedText {...defaultProps} text="Hello" currentCharIndex={3} />);
    const chars = document.querySelectorAll('.highlighted-text__char');
    expect(chars[0]).toHaveClass('highlighted-text__char--read');
    expect(chars[1]).toHaveClass('highlighted-text__char--read');
    expect(chars[2]).toHaveClass('highlighted-text__char--read');
    expect(chars[3]).toHaveClass('highlighted-text__char--active');
    expect(chars[4]).not.toHaveClass('highlighted-text__char--read');
  });

  it('maps char index correctly when audio tags are present', () => {
    // "Hi! [laughs] Bye" — source index 13 is 'B' in "Bye"
    // Display text is "Hi! Bye" — 'B' is display index 4
    render(<HighlightedText {...defaultProps} text="Hi! [laughs] Bye" currentCharIndex={13} />);
    const chars = document.querySelectorAll('.highlighted-text__char');
    // "Hi! Bye" = 7 display chars
    expect(chars.length).toBe(7);
    // chars 0-3 ("Hi! ") should be read, char 4 ("B") should be active
    expect(chars[3]).toHaveClass('highlighted-text__char--read');
    expect(chars[4]).toHaveClass('highlighted-text__char--active');
  });

  it('no highlights when currentCharIndex is -1', () => {
    render(<HighlightedText {...defaultProps} text="Hello" />);
    const chars = document.querySelectorAll('.highlighted-text__char');
    for (const char of chars) {
      expect(char).not.toHaveClass('highlighted-text__char--active');
      expect(char).not.toHaveClass('highlighted-text__char--read');
    }
  });

  it('handles empty text', () => {
    const { container } = render(<HighlightedText {...defaultProps} text="" />);
    expect(container.querySelector('.highlighted-text')).toBeInTheDocument();
  });
});
