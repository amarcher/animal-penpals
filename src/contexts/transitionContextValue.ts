import { createContext } from 'react';

export interface TransitionState {
  pendingResponse: string | null;
  setPendingResponse: (val: string | null) => void;
  externalText: { text: string; seq: number } | undefined;
  setExternalText: (val: { text: string; seq: number } | undefined) => void;
  ttsRequest: { seq: number } | undefined;
  setTtsRequest: (val: { seq: number } | undefined) => void;
  selectedAnimalId: string | null;
  setSelectedAnimalId: (val: string | null) => void;
}

export const TransitionContext = createContext<TransitionState | null>(null);
