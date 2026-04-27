import { useState, type ReactNode } from 'react';
import { TransitionContext } from './transitionContextValue.ts';

export function TransitionProvider({ children }: { children: ReactNode }) {
  const [pendingResponse, setPendingResponse] = useState<string | null>(null);
  const [externalText, setExternalText] = useState<{ text: string; seq: number } | undefined>(undefined);
  const [ttsRequest, setTtsRequest] = useState<{ seq: number } | undefined>(undefined);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);

  return (
    <TransitionContext.Provider value={{
      pendingResponse,
      setPendingResponse,
      externalText,
      setExternalText,
      ttsRequest,
      setTtsRequest,
      selectedAnimalId,
      setSelectedAnimalId,
    }}>
      {children}
    </TransitionContext.Provider>
  );
}
