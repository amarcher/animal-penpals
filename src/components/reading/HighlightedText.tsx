import { useEffect, useMemo, useRef } from 'react';
import type { WordTiming } from '../../hooks/useTtsPlayback.ts';
import './HighlightedText.css';

interface HighlightedTextProps {
  text: string;
  wordTimings: WordTiming[];
  currentWordIndex: number;
  currentCharIndex: number;
  animalColor: string;
}

/**
 * Strip ElevenLabs Audio Tags (e.g. [laughs], [whispers]) from text and
 * build a mapping from source char indices to display char indices.
 * Returns the clean display text and a lookup array where
 * sourceToDisplay[sourceIdx] = displayIdx (or -1 if inside a tag).
 */
function stripAudioTags(text: string): { displayText: string; sourceToDisplay: number[] } {
  const sourceToDisplay: number[] = [];
  let displayText = '';
  let inTag = false;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '[') {
      inTag = true;
      sourceToDisplay.push(-1);
    } else if (text[i] === ']') {
      inTag = false;
      sourceToDisplay.push(-1);
      // Skip trailing space after a tag
      if (i + 1 < text.length && text[i + 1] === ' ') {
        i++;
        sourceToDisplay.push(-1);
      }
    } else if (inTag) {
      sourceToDisplay.push(-1);
    } else {
      sourceToDisplay.push(displayText.length);
      displayText += text[i];
    }
  }

  return { displayText, sourceToDisplay };
}

export function HighlightedText({ text, currentCharIndex, animalColor }: HighlightedTextProps) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const activeCharRef = useRef<HTMLSpanElement>(null);

  const { displayText, sourceToDisplay } = useMemo(() => stripAudioTags(text), [text]);

  // Map the source-level currentCharIndex to a display-level index
  const displayCharIndex = useMemo(() => {
    if (currentCharIndex < 0) return -1;
    // Find the display index for the current source char, or the nearest
    // previous display char if we're inside a tag
    for (let i = currentCharIndex; i >= 0; i--) {
      if (i < sourceToDisplay.length && sourceToDisplay[i] >= 0) {
        return sourceToDisplay[i];
      }
    }
    return -1;
  }, [currentCharIndex, sourceToDisplay]);

  // Auto-scroll the paper to keep the active character visible
  useEffect(() => {
    if (displayCharIndex < 0 || !activeCharRef.current || !containerRef.current) return;
    const container = containerRef.current.closest('.reading__paper');
    if (!container) return;

    const charEl = activeCharRef.current;
    const containerRect = container.getBoundingClientRect();
    const charRect = charEl.getBoundingClientRect();

    if (charRect.bottom > containerRect.bottom - 40) {
      container.scrollBy({ top: charRect.bottom - containerRect.bottom + 80, behavior: 'smooth' });
    }
  }, [displayCharIndex]);

  const chars = displayText.split('');
  const hasHighlight = displayCharIndex >= 0;

  return (
    <p
      className="highlighted-text"
      style={{ '--animal-color': animalColor } as React.CSSProperties}
      ref={containerRef}
    >
      {chars.map((char, i) => {
        const isRead = hasHighlight && i < displayCharIndex;
        const isActive = hasHighlight && i === displayCharIndex;

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
