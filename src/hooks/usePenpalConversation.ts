import { useCallback, useEffect, useRef, useState } from 'react';
import { useConversation } from '@elevenlabs/react';
import type { AppState } from '../types/app.ts';
import { animals, getAnimalById } from '../data/animals.ts';

interface ConversationCallbacks {
  onSelectAnimal: (animalId: string) => void;
  onSendLetter: () => void;
  onGoToMailbox: () => void;
}

export type VoiceStatus = 'off' | 'connecting' | 'connected' | 'error';
export type MicError = 'timeout' | 'not-allowed' | 'device' | 'no-input' | null;

export function usePenpalConversation({ onSelectAnimal, onSendLetter, onGoToMailbox }: ConversationCallbacks) {
  const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID as string | undefined;
  const [sessionStarted, setSessionStarted] = useState(false);
  const [micError, setMicError] = useState<MicError>(null);
  const pendingNavRef = useRef<AppState | null>(null);
  const currentNavRef = useRef<string | null>(null);
  const inputVolumeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const conversation = useConversation({
    clientTools: {
      select_animal: (params: { name: string }) => {
        const match = animals.find(a =>
          a.name.toLowerCase().includes(params.name.toLowerCase()) ||
          a.species.toLowerCase().includes(params.name.toLowerCase()) ||
          a.id === params.name.toLowerCase()
        );
        if (!match) return `No animal found matching "${params.name}". Available: ${animals.map(a => a.name).join(', ')}`;
        onSelectAnimal(match.id);
        return `Navigated to ${match.name}'s writing page`;
      },
      send_letter: () => {
        onSendLetter();
        return 'Letter sent!';
      },
      go_to_mailbox: () => {
        onGoToMailbox();
        return 'Returned to mailbox';
      },
    },
    onConnect: () => {
      if (pendingNavRef.current) {
        const ctx = buildContextForView(pendingNavRef.current);
        if (ctx) conversation.sendContextualUpdate(ctx);
        pendingNavRef.current = null;
      }
    },
    onError: (error: unknown) => {
      console.error('[VoiceAgent] session error:', error);
    },
  });

  // Poll input volume after connecting
  useEffect(() => {
    if (conversation.status !== 'connected') {
      if (inputVolumeIntervalRef.current !== null) {
        clearInterval(inputVolumeIntervalRef.current);
        inputVolumeIntervalRef.current = null;
      }
      return;
    }

    const startedAt = Date.now();
    const POLL_DURATION_MS = 10_000;
    const POLL_INTERVAL_MS = 500;

    inputVolumeIntervalRef.current = setInterval(() => {
      const volume = conversation.getInputVolume();
      if (volume > 0) {
        clearInterval(inputVolumeIntervalRef.current!);
        inputVolumeIntervalRef.current = null;
        return;
      }
      if (Date.now() - startedAt >= POLL_DURATION_MS) {
        clearInterval(inputVolumeIntervalRef.current!);
        inputVolumeIntervalRef.current = null;
        setMicError('no-input');
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (inputVolumeIntervalRef.current !== null) {
        clearInterval(inputVolumeIntervalRef.current);
        inputVolumeIntervalRef.current = null;
      }
    };
  }, [conversation.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback(async () => {
    if (!agentId) return;

    if (sessionStarted) {
      await conversation.endSession().catch(() => {});
      setSessionStarted(false);
      return;
    }

    try {
      const micPromise = navigator.mediaDevices.getUserMedia({ audio: true });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new DOMException('getUserMedia timed out', 'TimeoutError')), 5_000)
      );
      const tempStream = await Promise.race([micPromise, timeoutPromise]);
      tempStream.getTracks().forEach(t => t.stop());
    } catch (err) {
      const error = err as DOMException;
      if (error.name === 'TimeoutError') setMicError('timeout');
      else if (error.name === 'NotAllowedError') setMicError('not-allowed');
      else setMicError('device');
      return;
    }

    setSessionStarted(true);

    try {
      await conversation.startSession({
        agentId,
        connectionType: 'websocket',
      });
    } catch (err) {
      console.error('[VoiceAgent] startSession failed:', err);
      setSessionStarted(false);
    }
  }, [agentId, sessionStarted, conversation]);

  const clearMicError = useCallback(() => setMicError(null), []);

  const notifyViewChange = useCallback((nav: AppState) => {
    if (!agentId) return;

    const key = JSON.stringify(nav);
    if (currentNavRef.current === key) return;
    currentNavRef.current = key;

    const ctx = buildContextForView(nav);
    if (!ctx) return;

    if (conversation.status === 'connected') {
      conversation.sendContextualUpdate(ctx);
    } else {
      pendingNavRef.current = nav;
    }
  }, [agentId, conversation]);

  const notifyDraftChange = useCallback((animalId: string, draftContent: string) => {
    if (!agentId || conversation.status !== 'connected') return;
    const animal = getAnimalById(animalId);
    if (!animal) return;
    conversation.sendContextualUpdate(
      `[DRAFT UPDATE] The child is writing a letter to ${animal.name} (${animal.species}).\n` +
      `Current draft: "${draftContent || '(empty \u2014 they haven\'t started writing yet)'}"\n` +
      `Help them with ideas if they seem stuck. Encourage them!`
    );
  }, [agentId, conversation]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (sessionStarted) {
        conversation.endSession().catch(() => {});
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  let status: VoiceStatus = 'off';
  if (sessionStarted) {
    if (conversation.status === 'connected') status = 'connected';
    else if (conversation.status === 'connecting') status = 'connecting';
    else if (conversation.status === 'disconnected') status = 'error';
    else status = 'connecting';
  }

  return {
    status,
    isSpeaking: conversation.isSpeaking,
    micError,
    clearMicError,
    notifyViewChange,
    notifyDraftChange,
    toggle,
    agentId,
  };
}

function buildContextForView(nav: AppState): string | null {
  switch (nav.view) {
    case 'mailbox':
      return [
        '[MAILBOX] The child is at the animal selection screen.',
        `Available pen pals: ${animals.map(a => `${a.emoji} ${a.name}`).join(', ')}`,
        'Encourage them to pick an animal to write to!',
      ].join('\n');
    case 'compose': {
      const animal = getAnimalById(nav.animalId);
      if (!animal) return null;
      return [
        `[COMPOSE] The child is writing a letter to ${animal.name} (${animal.species}).`,
        `${animal.name}'s personality: ${animal.personality}`,
        'Help them write their letter! Suggest fun things to ask or share.',
        'When they seem done, suggest sending it.',
      ].join('\n');
    }
    case 'sending': {
      const animal = getAnimalById(nav.animalId);
      if (!animal) return null;
      return `[SENDING] The letter to ${animal.name} is flying away! Build excitement about what ${animal.name} will write back.`;
    }
    case 'reading': {
      const animal = getAnimalById(nav.animalId);
      if (!animal) return null;
      return [
        `[READING] The child is reading a letter from ${animal.name}.`,
        'Let them enjoy reading. If they want, they can write back or choose a different animal.',
      ].join('\n');
    }
    default:
      return null;
  }
}
