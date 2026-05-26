import { useCallback, useEffect, useState } from 'react';
import type { CreateMailDraftInput, MailReplyDraft, UpdateMailDraftInput } from '../types/mail.ts';

const STORAGE_KEY = 'animal-penpals-parent-review-drafts';

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function loadDrafts(): MailReplyDraft[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) as MailReplyDraft[] : [];
  } catch {
    return [];
  }
}

function createFallbackDraft(childLetter: string): string {
  return [
    'Dear friend,',
    '',
    `I got your letter and tucked it into a very special spot so I could think about it carefully. I loved hearing this from you: "${childLetter.slice(0, 90)}${childLetter.length > 90 ? '...' : ''}"`,
    '',
    'Today I am writing back slowly, because the best letters need a little time and a lot of heart. I will send you something wonderful for your mailbox soon.',
    '',
    'Your friend',
  ].join('\n');
}

export function useParentReviewStore() {
  const [drafts, setDrafts] = useState<MailReplyDraft[]>(loadDrafts);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  }, [drafts]);

  const createDraft = useCallback(async (input: CreateMailDraftInput): Promise<MailReplyDraft> => {
    const now = Date.now();
    const draftId = generateId('draft');
    const pendingDraft: MailReplyDraft = {
      id: draftId,
      threadId: input.threadId,
      childLetterId: input.childLetterId,
      animalId: input.animalId,
      childLetter: input.childLetter,
      threadHistory: input.threadHistory,
      draftText: 'Drafting a thoughtful letter...',
      parentGuidance: '',
      status: 'drafting',
      createdAt: now,
      updatedAt: now,
    };

    setDrafts(prev => [pendingDraft, ...prev]);

    let draftText = createFallbackDraft(input.childLetter);
    try {
      const response = await fetch('/api/create-mail-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await response.json() as { draft?: string };
      if (data.draft) draftText = data.draft;
    } catch {
      // The local fallback keeps the parent-review prototype usable offline.
    }

    const readyDraft: MailReplyDraft = {
      ...pendingDraft,
      draftText,
      status: 'needs_parent_review',
      updatedAt: Date.now(),
    };

    setDrafts(prev => prev.map(draft => draft.id === draftId ? readyDraft : draft));
    return readyDraft;
  }, []);

  const updateDraft = useCallback((draftId: string, updates: UpdateMailDraftInput) => {
    setDrafts(prev => prev.map(draft => {
      if (draft.id !== draftId) return draft;
      return {
        ...draft,
        ...updates,
        updatedAt: Date.now(),
      };
    }));
  }, []);

  const regenerateDraft = useCallback(async (draftId: string, parentGuidance?: string): Promise<void> => {
    const draft = drafts.find(candidate => candidate.id === draftId);
    if (!draft) return;
    const guidance = parentGuidance ?? draft.parentGuidance;

    setDrafts(prev => prev.map(candidate => candidate.id === draftId
      ? { ...candidate, parentGuidance: guidance, status: 'drafting', updatedAt: Date.now() }
      : candidate
    ));

    let draftText = createFallbackDraft(draft.childLetter);
    try {
      const response = await fetch('/api/create-mail-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animalId: draft.animalId,
          threadId: draft.threadId,
          childLetterId: draft.childLetterId,
          childLetter: draft.childLetter,
          parentGuidance: guidance,
          threadHistory: draft.threadHistory,
        }),
      });
      const data = await response.json() as { draft?: string };
      if (data.draft) draftText = data.draft;
    } catch {
      // Keep the prototype usable if the server draft endpoint is unavailable.
    }

    setDrafts(prev => prev.map(candidate => candidate.id === draftId
      ? {
          ...candidate,
          draftText,
          parentGuidance: guidance,
          status: 'needs_parent_review',
          updatedAt: Date.now(),
        }
      : candidate
    ));
  }, [drafts]);

  const approveDraft = useCallback((draftId: string): string => {
    const token = generateId('read');
    setDrafts(prev => prev.map(draft => {
      if (draft.id !== draftId) return draft;
      const now = Date.now();
      return {
        ...draft,
        status: 'approved',
        qrToken: token,
        approvedAt: now,
        updatedAt: now,
      };
    }));
    return token;
  }, []);

  const getDraft = useCallback((draftId: string): MailReplyDraft | undefined => {
    return drafts.find(draft => draft.id === draftId);
  }, [drafts]);

  const getDraftByToken = useCallback((token: string): MailReplyDraft | undefined => {
    return drafts.find(draft => draft.qrToken === token);
  }, [drafts]);

  const getLatestDraftByThread = useCallback((threadId: string, animalId?: string): MailReplyDraft | undefined => {
    return drafts.find(draft =>
      draft.threadId === threadId && (!animalId || draft.animalId === animalId)
    );
  }, [drafts]);

  const pendingCount = drafts.filter(draft => draft.status === 'drafting' || draft.status === 'needs_parent_review').length;

  return { drafts, pendingCount, createDraft, updateDraft, regenerateDraft, approveDraft, getDraft, getDraftByToken, getLatestDraftByThread };
}

export type ParentReviewStore = ReturnType<typeof useParentReviewStore>;
