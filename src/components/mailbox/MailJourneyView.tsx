import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getAnimalById } from '../../data/animals.ts';
import type { MailReplyDraft } from '../../types/mail.ts';
import {
  getMailJourneyDetail,
  getMailJourneyHeadline,
  getMailJourneySteps,
  msUntilNextDisplayStatus,
} from '../../utils/mailJourney.ts';
import './MailJourneyView.css';

interface MailJourneyViewProps {
  animalId: string;
  threadId: string;
  draft?: MailReplyDraft;
  onBack: () => void;
}

export function MailJourneyView({ animalId, threadId, draft, onBack }: MailJourneyViewProps) {
  const animal = getAnimalById(animalId);

  // Re-render when the next simulated mail-journey transition is due so the
  // kid-facing status advances on its own without polling.
  const [, setTick] = useState(0);
  useEffect(() => {
    const ms = msUntilNextDisplayStatus(draft);
    if (ms === null) return;
    const id = window.setTimeout(() => setTick(t => t + 1), ms + 50);
    return () => window.clearTimeout(id);
  }, [draft]);

  if (!animal) return null;

  const steps = getMailJourneySteps(draft);

  return (
    <main className="mail-journey" style={{ '--animal-color': animal.color } as React.CSSProperties}>
      <section className="mail-journey__hero" aria-labelledby="mail-journey-title">
        <div className="mail-journey__passport" aria-hidden="true">
          <span>{animal.emoji}</span>
          <small>MAIL TRAIL</small>
        </div>
        <div>
          <p className="mail-journey__eyebrow">Tracking letter</p>
          <h1 id="mail-journey-title">{getMailJourneyHeadline(draft)}</h1>
          <strong className="mail-journey__receipt">Received instantly. Returning by snail mail.</strong>
          <p>{getMailJourneyDetail(draft)}</p>
        </div>
      </section>

      <section className="mail-journey__map" aria-label="Letter journey">
        {steps.map(step => (
          <article key={step.id} className={`mail-journey__step mail-journey__step--${step.state}`}>
            <span className="mail-journey__dot" aria-hidden="true" />
            <div>
              <h2>{step.label}</h2>
              <p>{step.detail}</p>
            </div>
          </article>
        ))}
      </section>

      <footer className="mail-journey__actions">
        <button type="button" onClick={onBack}>Back to mailbox</button>
        <Link to={`/compose/${animalId}?thread=${threadId}`}>Write another letter</Link>
      </footer>
    </main>
  );
}
