/**
 * Cross-route scratch state for the letter flow.
 *
 * `compose` → `sending`/`receiving` → `reading` are separate routes whose
 * components mount and unmount across the navigation. A few values need to
 * survive the unmount but don't drive any UI re-render — the in-flight Claude
 * promise that ReceivingRoute consumes, the draft text that handlers read,
 * etc. React refs aren't the right tool (they belong to a single component
 * instance) and React state would force re-renders we don't want.
 *
 * A plain module-level object is the right primitive here.
 */

interface LetterFlowState {
  responsePromise: Promise<string> | null;
  pendingResponse: string | null;
  letterContent: string | null;
  currentDraft: string;
  deliveryMode: 'instant' | 'mailbox';
}

const state: LetterFlowState = {
  responsePromise: null,
  pendingResponse: null,
  letterContent: null,
  currentDraft: '',
  deliveryMode: 'instant',
};

export const letterFlowState = {
  getResponsePromise: (): Promise<string> | null => state.responsePromise,
  setResponsePromise: (value: Promise<string> | null): void => { state.responsePromise = value; },

  getPendingResponse: (): string | null => state.pendingResponse,
  setPendingResponse: (value: string | null): void => { state.pendingResponse = value; },

  getLetterContent: (): string | null => state.letterContent,
  setLetterContent: (value: string | null): void => { state.letterContent = value; },

  getCurrentDraft: (): string => state.currentDraft,
  setCurrentDraft: (value: string): void => { state.currentDraft = value; },

  getDeliveryMode: (): 'instant' | 'mailbox' => state.deliveryMode,
  setDeliveryMode: (value: 'instant' | 'mailbox'): void => { state.deliveryMode = value; },

  /** Reset all values — primarily for tests. */
  reset: (): void => {
    state.responsePromise = null;
    state.pendingResponse = null;
    state.letterContent = null;
    state.currentDraft = '';
    state.deliveryMode = 'instant';
  },
};
