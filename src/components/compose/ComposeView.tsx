import { useCallback, useEffect, useRef, useState } from 'react';
import { getAnimalById } from '../../data/animals.ts';
import { getAnimalVideo } from '../../data/videoManifest.ts';
import { preloadVideo } from '../../utils/videoPreloadCache.ts';
import { useMailboxMode } from '../../utils/mailboxExperiment.ts';
import type { Thread } from '../../types/app.ts';
import './ComposeView.css';

const showsVideo = window.matchMedia('(min-width: 701px)');

interface ComposeViewProps {
  animalId: string;
  thread?: Thread;
  externalText?: { text: string; seq: number };
  onSend: (content: string) => void;
  onBack: () => void;
  onDraftChange?: (animalId: string, content: string) => void;
  onReadLetter?: (letterId: string) => void;
}

export function ComposeView({ animalId, thread, externalText, onSend, onBack, onDraftChange, onReadLetter }: ComposeViewProps) {
  const animal = getAnimalById(animalId);
  const videoEntry = getAnimalVideo(animalId, 'idle');
  const [mailboxModeEnabled] = useMailboxMode();
  const [draft, setDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Preload the receive video into the shared cache so ReceiveAnimation can
  // mount the already-buffered element instantly (no second network fetch).
  // NOTE: We intentionally do NOT evict on unmount — ComposeView unmounts when
  // transitioning to sending, but ReceiveAnimation needs the cached element later.
  // The cache entry is consumed (and can be evicted) by ReceiveAnimation itself.
  useEffect(() => {
    const receiveVideo = getAnimalVideo(animalId, 'receive');
    if (!receiveVideo) return;
    preloadVideo(receiveVideo.url);
  }, [animalId]);

  // Handle text written by the voice agent — adjust state when prop changes
  const [lastExternalSeq, setLastExternalSeq] = useState<number | undefined>(undefined);
  if (externalText && externalText.seq !== lastExternalSeq) {
    setLastExternalSeq(externalText.seq);
    const newDraft = draft ? draft + ' ' + externalText.text : externalText.text;
    setDraft(newDraft);
    if (onDraftChange) onDraftChange(animalId, newDraft);
  }

  // Scroll textarea to bottom when external text is appended
  useEffect(() => {
    if (externalText && textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [externalText]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDraft(value);
    if (onDraftChange) onDraftChange(animalId, value);
  }, [animalId, onDraftChange]);

  const handleSend = useCallback(() => {
    if (draft.trim()) {
      onSend(draft.trim());
    }
  }, [draft, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  if (!animal) return null;

  const previousLetters = thread?.letters ?? [];

  return (
    <div
      className="compose"
      style={{ '--animal-color': animal.color } as React.CSSProperties}
    >
      <header className="compose__header">
        <button className="compose__back" onClick={onBack} type="button" aria-label="Back to mailbox">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Mailbox
        </button>
        <span className="compose__recipient-name">Writing to {animal.name}</span>
        {mailboxModeEnabled && (
          <span className="compose__mail-mode">Snail mail reply</span>
        )}
      </header>

      <div className="compose__body">
        {videoEntry && (
          <div className="compose__video-wrap" style={showsVideo.matches ? { viewTransitionName: 'animal-video' } : undefined}>
            <video
              className="compose__video"
              src={videoEntry.url}
              poster={videoEntry.poster}
              autoPlay
              muted
              loop
              playsInline
              preload="none"
            />
          </div>
        )}

        <div className="compose__content">
          {previousLetters.length > 0 && (
            <div className="compose__history">
              {previousLetters.map(letter => (
                <div
                  key={letter.id}
                  className={`compose__history-letter compose__history-letter--${letter.from}`}
                >
                  <span className="compose__history-from">
                    {letter.from === 'child' ? 'You' : animal.name}
                    {letter.from === 'animal' && onReadLetter && (
                      <button
                        className="compose__history-read-btn"
                        onClick={() => onReadLetter(letter.id)}
                        type="button"
                        aria-label={`Read aloud letter from ${animal.name}`}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </button>
                    )}
                  </span>
                  <p className="compose__history-content">{letter.content}</p>
                </div>
              ))}
            </div>
          )}

          <div className="compose__paper">
            <div className="compose__paper-lines" />
            <p className="compose__greeting">Dear {animal.name},</p>
            <textarea
              ref={textareaRef}
              className="compose__textarea"
              value={draft}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Write your letter here..."
              aria-label={`Letter to ${animal.name}`}
              rows={6}
            />
          </div>

          <div className="compose__actions">
            <button
              className="compose__send"
              onClick={handleSend}
              disabled={!draft.trim()}
              type="button"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              {mailboxModeEnabled ? 'Send to Mailbox' : 'Send Letter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
