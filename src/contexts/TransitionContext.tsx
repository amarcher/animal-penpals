import { createContext, useContext, useRef, useState, type MutableRefObject, type ReactNode } from 'react';

interface TransitionState {
  responsePromiseRef: MutableRefObject<Promise<string> | null>;
  pendingResponseRef: MutableRefObject<string | null>;
  pendingResponse: string | null;
  setPendingResponse: (val: string | null) => void;
  letterContentRef: MutableRefObject<string | null>;
  currentDraftRef: MutableRefObject<string>;
  externalText: { text: string; seq: number } | undefined;
  setExternalText: (val: { text: string; seq: number } | undefined) => void;
  ttsRequest: { seq: number } | undefined;
  setTtsRequest: (val: { seq: number } | undefined) => void;
}

const TransitionContext = createContext<TransitionState | null>(null);

export function TransitionProvider({ children }: { children: ReactNode }) {
  const responsePromiseRef = useRef<Promise<string> | null>(null);
  const pendingResponseRef = useRef<string | null>(null);
  const [pendingResponse, setPendingResponse] = useState<string | null>(null);
  const letterContentRef = useRef<string | null>(null);
  const currentDraftRef = useRef('');
  const [externalText, setExternalText] = useState<{ text: string; seq: number } | undefined>(undefined);
  const [ttsRequest, setTtsRequest] = useState<{ seq: number } | undefined>(undefined);

  return (
    <TransitionContext.Provider value={{
      responsePromiseRef,
      pendingResponseRef,
      pendingResponse,
      setPendingResponse,
      letterContentRef,
      currentDraftRef,
      externalText,
      setExternalText,
      ttsRequest,
      setTtsRequest,
    }}>
      {children}
    </TransitionContext.Provider>
  );
}

export function useTransitionContext(): TransitionState {
  const ctx = useContext(TransitionContext);
  if (!ctx) throw new Error('useTransitionContext must be used within TransitionProvider');
  return ctx;
}
