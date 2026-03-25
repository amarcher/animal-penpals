import type { WordTiming } from '../../hooks/useTtsPlayback.ts';
import './HighlightedText.css';

interface HighlightedTextProps {
  text: string;
  wordTimings: WordTiming[];
  currentWordIndex: number;
  animalColor: string;
}

export function HighlightedText({ text, wordTimings, currentWordIndex, animalColor }: HighlightedTextProps) {
  const words = text.split(/\s+/);
  const hasTimings = wordTimings.length > 0;

  return (
    <p
      className="highlighted-text"
      style={{ '--animal-color': animalColor } as React.CSSProperties}
    >
      {words.map((word, i) => {
        const isActive = hasTimings && i === currentWordIndex;
        const isRead = hasTimings && currentWordIndex >= 0 && i < currentWordIndex;
        const className = [
          'highlighted-text__word',
          isActive && 'highlighted-text__word--active',
          isRead && 'highlighted-text__word--read',
        ].filter(Boolean).join(' ');

        return (
          <span key={i} className={className}>
            {word}{' '}
          </span>
        );
      })}
    </p>
  );
}
