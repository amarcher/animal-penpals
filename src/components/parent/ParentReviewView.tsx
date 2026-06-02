import { useState } from 'react';
import { Link } from 'react-router';
import { getAnimalById } from '../../data/animals.ts';
import type { ParentReviewStore } from '../../hooks/useParentReviewStore.ts';
import { useMailboxMode } from '../../utils/mailboxExperiment.ts';
import './ParentReviewView.css';

interface ParentReviewViewProps {
  reviewStore: ParentReviewStore;
}

export function ParentReviewView({ reviewStore }: ParentReviewViewProps) {
  const [mailboxEnabled, setMailboxEnabled] = useMailboxMode();
  const [editingText, setEditingText] = useState<Record<string, string>>({});
  const [guidanceText, setGuidanceText] = useState<Record<string, string>>({});

  const handleToggleMailbox = () => {
    setMailboxEnabled(!mailboxEnabled);
  };

  return (
    <main className="parent-review">
      <header className="parent-review__header">
        <div>
          <p className="parent-review__eyebrow">Parent dashboard</p>
          <h1>Approve the animal reply</h1>
          <p className="parent-review__dek">
            The child already saw the animal receive and read their letter. This is the proposed response that will travel back by mailbox.
          </p>
        </div>
        <div className="parent-review__header-actions">
          <button type="button" onClick={handleToggleMailbox} aria-pressed={mailboxEnabled}>
            {mailboxEnabled ? 'Mailbox mode on' : 'Mailbox mode off'}
          </button>
          <Link to="/mailbox">Kid mailbox</Link>
        </div>
      </header>

      {reviewStore.drafts.length === 0 ? (
        <section className="parent-review__empty">
          <h2>No response proposals yet</h2>
          <p>Turn on mailbox mode, have the child send a letter, and the animal will receive it immediately while its reply waits here for approval.</p>
        </section>
      ) : (
        <section className="parent-review__list" aria-label="Animal response proposals">
          {reviewStore.drafts.map(draft => {
            const animal = getAnimalById(draft.animalId);
            const textValue = editingText[draft.id] ?? draft.draftText;
            const guidanceValue = guidanceText[draft.id] ?? draft.parentGuidance;
            const isApproved = draft.status === 'approved';

            return (
              <article
                key={draft.id}
                className="parent-review__card"
                style={{ '--animal-color': animal?.color ?? '#6c8cff' } as React.CSSProperties}
              >
                <div className="parent-review__card-head">
                  <div>
                    <span className="parent-review__animal">{animal?.name ?? draft.animalId}</span>
                    <span className="parent-review__proposal-label">Response proposal</span>
                    <span className={`parent-review__status parent-review__status--${draft.status}`}>
                      {draft.status.replaceAll('_', ' ')}
                    </span>
                  </div>
                  {isApproved && draft.qrToken && (
                    <div className="parent-review__links">
                      <Link to={`/print/${draft.id}`}>Print letter</Link>
                      <Link to={`/read-aloud/${draft.qrToken}`}>QR read-aloud</Link>
                    </div>
                  )}
                  {!isApproved && (
                    <div className="parent-review__links">
                      <Link to={`/parent/preview/${draft.id}`}>Preview read-aloud</Link>
                    </div>
                  )}
                </div>

                <details className="parent-review__child-letter">
                  <summary>What the child sent</summary>
                  <p>{draft.childLetter}</p>
                </details>

                <label className="parent-review__field">
                  <span>What should this letter gently include?</span>
                  <input
                    value={guidanceValue}
                    onChange={event => setGuidanceText(prev => ({ ...prev, [draft.id]: event.target.value }))}
                    onBlur={() => reviewStore.updateDraft(draft.id, { parentGuidance: guidanceValue })}
                    placeholder="Example: celebrate how hard they tried, and gently encourage patience at bedtime"
                  />
                </label>

                <label className="parent-review__field">
                  <span>Proposed animal response</span>
                  <textarea
                    value={textValue}
                    onChange={event => setEditingText(prev => ({ ...prev, [draft.id]: event.target.value }))}
                    onBlur={() => reviewStore.updateDraft(draft.id, { draftText: textValue })}
                    rows={10}
                  />
                </label>

                <div className="parent-review__actions">
                  <button
                    type="button"
                    onClick={() => reviewStore.updateDraft(draft.id, {
                      draftText: textValue,
                      parentGuidance: guidanceValue,
                      status: 'needs_parent_review',
                    })}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void reviewStore.regenerateDraft(draft.id, guidanceValue);
                    }}
                    disabled={draft.status === 'drafting'}
                  >
                    Regenerate
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewStore.approveDraft(draft.id)}
                    disabled={isApproved || draft.status === 'drafting'}
                  >
                    {isApproved ? 'Approved' : 'Approve video + mailbox letter'}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
