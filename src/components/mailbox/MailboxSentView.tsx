import { Link } from 'react-router';
import { getAnimalById } from '../../data/animals.ts';
import './MailboxSentView.css';

interface MailboxSentViewProps {
  animalId: string;
  threadId: string;
  onBack: () => void;
}

export function MailboxSentView({ animalId, threadId, onBack }: MailboxSentViewProps) {
  const animal = getAnimalById(animalId);
  if (!animal) return null;

  return (
    <main className="mailbox-sent" style={{ '--animal-color': animal.color } as React.CSSProperties}>
      <section className="mailbox-sent__scene" aria-labelledby="mailbox-sent-title">
        <div className="mailbox-sent__stamp" aria-hidden="true">
          <span>{animal.emoji}</span>
        </div>
        <div className="mailbox-sent__copy">
          <p className="mailbox-sent__eyebrow">Letter received</p>
          <h1 id="mailbox-sent-title">{animal.name} is writing back carefully.</h1>
          <p>
            Your pen pal tucked your letter somewhere special and started a real reply for the mailbox.
          </p>
        </div>
        <div className="mailbox-sent__steps" aria-label="What happens next">
          <span>Reading</span>
          <span>Writing</span>
          <span>Sealing</span>
          <span>Mailing</span>
        </div>
        <div className="mailbox-sent__actions">
          <button type="button" onClick={onBack}>Back to mailbox</button>
          <Link to={`/mail-journey/${animalId}/${threadId}`}>Track the journey</Link>
          <Link to="/parent/review">Parent review</Link>
        </div>
      </section>
    </main>
  );
}
