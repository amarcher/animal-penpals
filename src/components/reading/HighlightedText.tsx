import { useEffect, useRef } from 'react';
import type { WordTiming } from '../../hooks/useTtsPlayback.ts';
import './HighlightedText.css';

interface HighlightedTextProps {
  text: string;
  wordTimings: WordTiming[];
  currentWordIndex: number;
  currentCharIndex: number;
  animalColor: string;
}

export function HighlightedText({ text, currentCharIndex, animalColor }: HighlightedTextProps) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const activeCharRef = useRef<HTMLSpanElement>(null);

  // Auto-scroll the paper to keep the active word visible
  useEffect(() => {
    if (currentCharIndex < 0 || !activeCharRef.current || !containerRef.current) return;
    const container = containerRef.current.closest('.reading__paper');
    if (!container) return;

    const charEl = activeCharRef.current;
    const containerRect = container.getBoundingClientRect();
    const charRect = charEl.getBoundingClientRect();

    // If the active character is below the visible area, scroll smoothly
    if (charRect.bottom > containerRect.bottom - 40) {
      container.scrollBy({ top: charRect.bottom - containerRect.bottom + 80, behavior: 'smooth' });
    }
  }, [currentCharIndex]);

  // Build character spans with coloring based on read position
  const chars = text.split('');
  const hasHighlight = currentCharIndex >= 0;

  return (
    <p
      className="highlighted-text"
      style={{ '--animal-color': animalColor } as React.CSSProperties}
      ref={containerRef}
    >
      {chars.map((char, i) => {
        const isRead = hasHighlight && i < currentCharIndex;
        const isActive = hasHighlight && i === currentCharIndex;

        if (isActive) {
          return (
            <span key={i} ref={activeCharRef} className="highlighted-text__char highlighted-text__char--active">
              {char}
            </span>
          );
        }

        if (isRead) {
          return (
            <span key={i} className="highlighted-text__char highlighted-text__char--read">
              {char}
            </span>
          );
        }

        return <span key={i} className="highlighted-text__char">{char}</span>;
      })}
    </p>
  );
}
