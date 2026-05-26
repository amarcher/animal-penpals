import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useParentReviewStore } from './useParentReviewStore.ts';

describe('useParentReviewStore', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('starts with empty drafts', () => {
    const { result } = renderHook(() => useParentReviewStore());
    expect(result.current.drafts).toEqual([]);
    expect(result.current.pendingCount).toBe(0);
  });

  it('creates a review draft from the API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ draft: 'Dear friend,\n\nI am writing from my cozy den.' }),
    }));

    const { result } = renderHook(() => useParentReviewStore());

    await act(async () => {
      await result.current.createDraft({
        animalId: 'fox',
        threadId: 'thread-1',
        childLetterId: 'letter-1',
        childLetter: 'I made a tower.',
        threadHistory: [],
      });
    });

    expect(result.current.drafts).toHaveLength(1);
    expect(result.current.drafts[0]).toMatchObject({
      animalId: 'fox',
      status: 'needs_parent_review',
      draftText: 'Dear friend,\n\nI am writing from my cozy den.',
    });
  });

  it('falls back to a local draft if the API fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const { result } = renderHook(() => useParentReviewStore());

    await act(async () => {
      await result.current.createDraft({
        animalId: 'owl',
        threadId: 'thread-1',
        childLetterId: 'letter-1',
        childLetter: 'I read a book today.',
        threadHistory: [],
      });
    });

    expect(result.current.drafts[0].status).toBe('needs_parent_review');
    expect(result.current.drafts[0].draftText).toContain('I got your letter');
  });

  it('updates and approves a draft with a read-aloud token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ draft: 'Original draft' }),
    }));
    const { result } = renderHook(() => useParentReviewStore());

    await act(async () => {
      await result.current.createDraft({
        animalId: 'bee',
        threadId: 'thread-1',
        childLetterId: 'letter-1',
        childLetter: 'Hello Bea!',
        threadHistory: [],
      });
    });

    const draftId = result.current.drafts[0].id;

    act(() => {
      result.current.updateDraft(draftId, {
        draftText: 'Edited draft',
        parentGuidance: 'Encourage putting shoes away.',
      });
    });

    let token = '';
    act(() => {
      token = result.current.approveDraft(draftId);
    });

    expect(result.current.getDraft(draftId)?.draftText).toBe('Edited draft');
    expect(result.current.getDraft(draftId)?.status).toBe('approved');
    expect(result.current.getDraftByToken(token)?.id).toBe(draftId);
    expect(result.current.getLatestDraftByThread('thread-1', 'bee')?.id).toBe(draftId);
  });

  it('regenerates using parent guidance', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ json: () => Promise.resolve({ draft: 'Original draft' }) })
      .mockResolvedValueOnce({ json: () => Promise.resolve({ draft: 'Guided draft' }) });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useParentReviewStore());

    await act(async () => {
      await result.current.createDraft({
        animalId: 'penguin',
        threadId: 'thread-1',
        childLetterId: 'letter-1',
        childLetter: 'I slipped on the floor.',
        threadHistory: [],
      });
    });

    const draftId = result.current.drafts[0].id;

    await act(async () => {
      await result.current.regenerateDraft(draftId, 'Encourage patience.');
    });

    expect(result.current.getDraft(draftId)?.draftText).toBe('Guided draft');
    expect(result.current.getDraft(draftId)?.parentGuidance).toBe('Encourage patience.');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).parentGuidance).toBe('Encourage patience.');
  });
});
