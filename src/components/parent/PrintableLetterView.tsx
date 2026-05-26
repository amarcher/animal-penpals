import { Link } from 'react-router';
import { getAnimalById } from '../../data/animals.ts';
import type { MailReplyDraft } from '../../types/mail.ts';
import './PrintableLetterView.css';

interface PrintableLetterViewProps {
  draft: MailReplyDraft;
}

export function PrintableLetterView({ draft }: PrintableLetterViewProps) {
  const animal = getAnimalById(draft.animalId);
  const readUrl = draft.qrToken ? `${window.location.origin}/read-aloud/${draft.qrToken}` : '';
  const qrUrl = readUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(readUrl)}`
    : '';

  return (
    <main className="print-letter" style={{ '--animal-color': animal?.color ?? '#6c8cff' } as React.CSSProperties}>
      <nav className="print-letter__toolbar" aria-label="Print letter actions">
        <Link to="/parent/review">Back to review</Link>
        <button type="button" onClick={() => window.print()}>Print</button>
      </nav>

      <article className="print-letter__page">
        <header className="print-letter__letterhead">
          <div>
            <p>From the desk of</p>
            <h1>{animal?.name ?? draft.animalId}</h1>
          </div>
          <div className="print-letter__mark" aria-hidden="true">{animal?.emoji}</div>
        </header>

        <div className="print-letter__body">
          {draft.draftText.split('\n').filter(Boolean).map((paragraph, index) => (
            <p key={`${draft.id}-${index}`}>{paragraph}</p>
          ))}
        </div>

        {readUrl && (
          <footer className="print-letter__footer">
            <img src={qrUrl} alt="QR code for read-aloud letter" />
            <div>
              <strong>Hear me read this letter</strong>
              <span>{readUrl}</span>
            </div>
          </footer>
        )}
      </article>
    </main>
  );
}
