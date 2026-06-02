import { describe, it, expect } from 'vitest';
import {
  getDisplayStatus,
  getMailJourneyDetail,
  getMailJourneyHeadline,
  getMailJourneySteps,
  msUntilNextDisplayStatus,
} from './mailJourney.ts';
import type { MailReplyDraft } from '../types/mail.ts';

function createDraft(status: MailReplyDraft['status'], approvedAt?: number): MailReplyDraft {
  return {
    id: 'draft-1',
    threadId: 'thread-1',
    childLetterId: 'letter-1',
    animalId: 'penguin',
    childLetter: 'Hi Percy!',
    threadHistory: [],
    draftText: 'A draft',
    parentGuidance: '',
    status,
    createdAt: 1,
    updatedAt: 1,
    approvedAt,
  };
}

describe('mailJourney', () => {
  it('turns parent review waiting into an adventure delay', () => {
    const draft = createDraft('needs_parent_review');
    expect(getMailJourneyHeadline(draft)).toBe('Waiting for launch');
    expect(getMailJourneyDetail(draft)).toContain('Antarctica');
  });

  it('marks previous, current, and waiting steps', () => {
    const steps = getMailJourneySteps(createDraft('printing'));
    expect(steps.find(step => step.id === 'approved')?.state).toBe('done');
    expect(steps.find(step => step.id === 'printing')?.state).toBe('current');
    expect(steps.find(step => step.id === 'delivered')?.state).toBe('waiting');
  });

  it('advances an approved draft through the simulated journey over time', () => {
    const approvedAt = 1_000_000;
    const draft = createDraft('approved', approvedAt);

    expect(getDisplayStatus(draft, approvedAt)).toBe('approved');
    expect(getDisplayStatus(draft, approvedAt + 31_000)).toBe('rendered');
    expect(getDisplayStatus(draft, approvedAt + 91_000)).toBe('submitted_to_mail_vendor');
    expect(getDisplayStatus(draft, approvedAt + 4 * 60_000)).toBe('printing');
    expect(getDisplayStatus(draft, approvedAt + 9 * 60_000)).toBe('in_mail_stream');
    expect(getDisplayStatus(draft, approvedAt + 25 * 60_000)).toBe('delivered');
  });

  it('reports the next transition delay so views can schedule re-renders', () => {
    const approvedAt = 1_000_000;
    const draft = createDraft('approved', approvedAt);

    expect(msUntilNextDisplayStatus(draft, approvedAt)).toBe(30_000);
    expect(msUntilNextDisplayStatus(draft, approvedAt + 30_000)).toBe(60_000); // next is submitted at 90s
    expect(msUntilNextDisplayStatus(draft, approvedAt + 25 * 60_000)).toBeNull();
    expect(msUntilNextDisplayStatus(createDraft('needs_parent_review'))).toBeNull();
  });
});
