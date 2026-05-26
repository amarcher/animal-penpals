import type { MailReplyDraft, MailReplyStatus } from '../types/mail.ts';

export interface MailJourneyStep {
  id: string;
  label: string;
  detail: string;
  state: 'done' | 'current' | 'waiting';
}

const statusOrder: MailReplyStatus[] = [
  'drafting',
  'needs_parent_review',
  'approved',
  'rendered',
  'submitted_to_mail_vendor',
  'printing',
  'in_mail_stream',
  'delivered',
];

// Simulated snail-mail journey timing (ms from approvedAt).
// Real fulfillment will be days; the prototype compresses the journey so it
// stays visible inside a single demo session.
const simulatedTransitions: Array<{ status: MailReplyStatus; afterMs: number }> = [
  { status: 'rendered', afterMs: 30_000 },
  { status: 'submitted_to_mail_vendor', afterMs: 90_000 },
  { status: 'printing', afterMs: 3 * 60_000 },
  { status: 'in_mail_stream', afterMs: 8 * 60_000 },
  { status: 'delivered', afterMs: 18 * 60_000 },
];

const childLabels: Record<MailReplyStatus, { label: string; detail: string }> = {
  drafting: {
    label: 'Writing the reply',
    detail: 'Your animal friend already received the letter and is thinking hard about what to send back.',
  },
  needs_parent_review: {
    label: 'Waiting for launch',
    detail: 'The reply is packed for a mailbox journey. A grown-up helps check the message before it leaves, so while it waits, it may take a scenic detour past Antarctica.',
  },
  parent_changes_requested: {
    label: 'Taking the scenic route',
    detail: 'The letter is gathering one more story before it gets sealed.',
  },
  approved: {
    label: 'Sealing the envelope',
    detail: 'The reply has its stamp, its secret read-aloud code, and a very official animal flourish.',
  },
  rendered: {
    label: 'Ready for the mailbag',
    detail: 'The letter has become a real printable page and is waiting for its trip.',
  },
  submitted_to_mail_vendor: {
    label: 'At the post office',
    detail: 'The mailbag has accepted the letter and the journey has officially begun.',
  },
  printing: {
    label: 'Being printed',
    detail: 'Ink is landing on paper. This is where digital magic turns into something you can hold.',
  },
  in_mail_stream: {
    label: 'Traveling to you',
    detail: 'The letter is moving closer through the mail stream.',
  },
  delivered: {
    label: 'Delivered',
    detail: 'The letter should be ready to find in the mailbox.',
  },
  canceled: {
    label: 'Back at base camp',
    detail: 'This trip was stopped, but the animal can try again with a new letter.',
  },
  failed: {
    label: 'Lost trail',
    detail: 'The letter hit a problem on its route. A grown-up can help restart the journey.',
  },
};

/**
 * Returns the status the kid should see. For approved drafts, advances through
 * the simulated snail-mail timeline based on time since approvedAt. The
 * persisted draft.status stays at 'approved' — vendor wiring will replace this
 * later by writing real transitions.
 */
export function getDisplayStatus(draft?: MailReplyDraft, now: number = Date.now()): MailReplyStatus {
  if (!draft) return 'drafting';
  if (draft.status !== 'approved' || !draft.approvedAt) return draft.status;

  const elapsed = now - draft.approvedAt;
  let current: MailReplyStatus = 'approved';
  for (const transition of simulatedTransitions) {
    if (elapsed >= transition.afterMs) current = transition.status;
    else break;
  }
  return current;
}

/**
 * ms until the next simulated transition fires, or null if the journey is at
 * a terminal state. Used by views to schedule the next re-render.
 */
export function msUntilNextDisplayStatus(draft?: MailReplyDraft, now: number = Date.now()): number | null {
  if (!draft || draft.status !== 'approved' || !draft.approvedAt) return null;
  const elapsed = now - draft.approvedAt;
  for (const transition of simulatedTransitions) {
    if (elapsed < transition.afterMs) return transition.afterMs - elapsed;
  }
  return null;
}

export function getMailJourneySteps(draft?: MailReplyDraft, now: number = Date.now()): MailJourneyStep[] {
  const displayStatus = getDisplayStatus(draft, now);
  const currentIndex = Math.max(0, statusOrder.indexOf(displayStatus));

  return statusOrder.map((status, index) => ({
    id: status,
    label: childLabels[status].label,
    detail: childLabels[status].detail,
    state: index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'waiting',
  }));
}

export function getMailJourneyHeadline(draft?: MailReplyDraft, now: number = Date.now()): string {
  if (!draft) return 'The mail trail is getting ready.';
  return childLabels[getDisplayStatus(draft, now)].label;
}

export function getMailJourneyDetail(draft?: MailReplyDraft, now: number = Date.now()): string {
  if (!draft) return 'Your animal friend received the letter and is looking for the right envelope.';
  return childLabels[getDisplayStatus(draft, now)].detail;
}
