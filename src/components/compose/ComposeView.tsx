import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getAnimalById } from '../../data/animals.ts';
import type { Thread } from '../../types/app.ts';
import './ComposeView.css';

interface ComposeViewProps {
  animalId: string;
  thread?: Thread;
  externalText?: { text: string; seq: number };
  onSend: (content: string) => void;
  onBack: () => void;
  onDraftChange?: (animalId: string, content: string) => void;
}

export function ComposeView({ animalId, thread, externalText, onSend, onBack, onDraftChange }: ComposeViewProps) {
  const animal = getAnimalById(animalId);
  const [draft, setDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Handle text written by the voice agent
  useEffect(() => {
    if (externalText) {
      setDraft(prev => {
        const newDraft = prev ? prev + ' ' + externalText.text : externalText.text;
        if (onDraftChange) onDraftChange(animalId, newDraft);
        return newDraft;
      });
      // Scroll textarea to bottom after agent writes
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
      }, 0);
    }
  }, [externalText]); // eslint-disable-line react-hooks/exhaustive-deps

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
    <motion.div
      className="compose"
      style={{ '--animal-color': animal.color } as React.CSSProperties}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <header className="compose__header">
        <button className="compose__back" onClick={onBack} type="button" aria-label="Back to mailbox">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <div className="compose__recipient">
          <span className="compose__recipient-emoji">{animal.emoji}</span>
          <span className="compose__recipient-name">Writing to {animal.name}</span>
        </div>
      </header>

      {previousLetters.length > 0 && (
        <div className="compose__history">
          {previousLetters.map(letter => (
            <div
              key={letter.id}
              className={`compose__history-letter compose__history-letter--${letter.from}`}
            >
              <span className="compose__history-from">
                {letter.from === 'child' ? 'You' : animal.emoji + ' ' + animal.name}
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
          rows={8}
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
          Send Letter
        </button>
        <span className="compose__hint">Ctrl+Enter to send</span>
      </div>
    </motion.div>
  );
}
