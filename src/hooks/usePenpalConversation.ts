import { useCallback, useEffect, useRef, useState } from 'react';
import { useConversation } from '@elevenlabs/react';
import type { AppState, Thread } from '../types/app.ts';
import { animals, getAnimalById } from '../data/animals.ts';

export interface SessionContext {
  nav: AppState;
  draft: string;
  thread: Thread | undefined;
}

interface ConversationCallbacks {
  onSelectAnimal: (animalId: string) => void;
  onSendLetter: () => string;
  onGoToMailbox: () => void;
  onWriteText: (text: string) => string;
  onReadAloud: () => string;
  onReadPreviousLetter: (letterIndex: number) => string;
  getSessionContext: () => SessionContext;
}

export type VoiceStatus = 'off' | 'connecting' | 'connected' | 'error';
export type MicError = 'timeout' | 'not-allowed' | 'device' | 'no-input' | null;

export function usePenpalConversation({ onSelectAnimal, onSendLetter, onGoToMailbox, onWriteText, onReadAloud, onReadPreviousLetter, getSessionContext }: ConversationCallbacks) {
  const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID as string | undefined;
  const [sessionStarted, setSessionStarted] = useState(false);
  const [micError, setMicError] = useState<MicError>(null);
  const [agentVolume, setAgentVolume] = useState(1);
  const muteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingContextRef = useRef<string | null>(null);
  const currentNavRef = useRef<string | null>(null);
  const inputVolumeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const conversation = useConversation({
    volume: agentVolume,
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
      // These callbacks report success or failure (e.g. "the letter is empty")
      // — return their result verbatim so the agent knows what actually happened.
      write_text: (params: { text: string }) => {
        return onWriteText(params.text);
      },
      send_letter: () => {
        return onSendLetter();
      },
      go_to_mailbox: () => {
        onGoToMailbox();
        return 'Returned to mailbox';
      },
      read_letter_aloud: () => {
        return onReadAloud();
      },
      read_previous_letter: (params: { letterIndex: number }) => {
        return onReadPreviousLetter(params.letterIndex);
      },
    },
    onConnect: () => {
      if (pendingContextRef.current) {
        conversation.sendContextualUpdate(pendingContextRef.current);
        pendingContextRef.current = null;
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
      // endSession() returns void in @elevenlabs/react v1 (no promise to .catch);
      // errors surface via the onError callback.
      try { conversation.endSession(); } catch { /* already torn down */ }
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
      let firstMessage: string | null = null;
      try {
        const sessionCtx = getSessionContext();
        firstMessage = buildFirstMessage(sessionCtx);
        pendingContextRef.current = buildRichContext(sessionCtx);
      } catch (e) {
        console.warn('[VoiceAgent] failed to build session context:', e);
      }

      // startSession() returns void in v1; connection failures surface through
      // the onError callback rather than a rejected promise.
      conversation.startSession({
        agentId,
        connectionType: 'websocket',
        ...(firstMessage ? { overrides: { agent: { firstMessage } } } : {}),
      });
    } catch (err) {
      console.error('[VoiceAgent] startSession failed:', err);
      setSessionStarted(false);
    }
  }, [agentId, sessionStarted, conversation, getSessionContext]);

  const clearMicError = useCallback(() => setMicError(null), []);

  const notifyViewChange = useCallback((nav: AppState, thread?: Thread, draft?: string) => {
    if (!agentId) return;

    const key = JSON.stringify(nav);
    if (currentNavRef.current === key) return;
    currentNavRef.current = key;

    const ctx = buildRichContext({ nav, draft: draft ?? '', thread });
    if (!ctx) return;

    if (conversation.status === 'connected') {
      conversation.sendContextualUpdate(ctx);
    } else {
      pendingContextRef.current = ctx;
    }
  }, [agentId, conversation]);

  const muteAgent = useCallback(() => {
    setAgentVolume(0);
    // Safety timeout: force unmute after 45s in case TTS never ends
    if (muteTimeoutRef.current) clearTimeout(muteTimeoutRef.current);
    muteTimeoutRef.current = setTimeout(() => setAgentVolume(1), 45_000);
  }, []);

  const unmuteAgent = useCallback(() => {
    if (muteTimeoutRef.current) {
      clearTimeout(muteTimeoutRef.current);
      muteTimeoutRef.current = null;
    }
    // Small delay so agent doesn't immediately blurt after TTS ends
    setTimeout(() => setAgentVolume(1), 500);
  }, []);

  const notifyLetterReceivedWithTts = useCallback((animalId: string, letterContent: string) => {
    if (!agentId || conversation.status !== 'connected') return;
    const animal = getAnimalById(animalId);
    if (!animal) return;
    conversation.sendContextualUpdate(
      `[LETTER RECEIVED] ${animal.name} wrote back! The letter is being read aloud automatically in ${animal.name}'s voice.\n\n` +
      `"${letterContent}"\n\n` +
      `IMPORTANT: Do NOT speak, do NOT offer to read the letter, and do NOT use read_letter_aloud. The child is listening to it right now.\n` +
      `When they finish listening, help them understand words, suggest writing back, or choosing another animal.`
    );
  }, [agentId, conversation]);

  const notifyLetterReceivedNoTts = useCallback((animalId: string, letterContent: string) => {
    if (!agentId || conversation.status !== 'connected') return;
    const animal = getAnimalById(animalId);
    if (!animal) return;
    conversation.sendContextualUpdate(
      `[LETTER RECEIVED] ${animal.name} wrote back! Here is the letter:\n\n"${letterContent}"\n\n` +
      `The child is now reading this letter on screen. You can:\n` +
      `- Use read_letter_aloud to have ${animal.name}'s voice read the letter out loud\n` +
      `- Help the child understand words they might not know\n` +
      `- When they're ready, suggest writing back or choosing another animal`
    );
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
        try { conversation.endSession(); } catch { /* already torn down */ }
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
    notifyLetterReceivedWithTts,
    notifyLetterReceivedNoTts,
    notifyDraftChange,
    muteAgent,
    unmuteAgent,
    toggle,
    agentId,
  };
}

export function formatConversationHistory(thread: Thread | undefined, animalName: string): string | null {
  if (!thread || thread.letters.length === 0) return null;
  const lines = [`[CONVERSATION HISTORY with ${animalName}]`];
  for (const letter of thread.letters) {
    const sender = letter.from === 'child' ? 'Child' : animalName;
    lines.push(`${sender}: "${letter.content}"`);
  }
  return lines.join('\n');
}

export function buildFirstMessage(ctx: SessionContext): string | null {
  switch (ctx.nav.view) {
    case 'mailbox':
      return "Hey, I'm back! Which animal friend should we write to?";
    case 'compose': {
      const animal = getAnimalById(ctx.nav.animalId);
      if (!animal) return null;
      if (ctx.draft) {
        return `I see you're writing to ${animal.name}. Go ahead, I'm listening! Tell me when you want to send it.`;
      }
      if (ctx.thread && ctx.thread.letters.length > 0) {
        return `Let's write back to ${animal.name}! Just tell me what you want to say and I'll write it down. Say "send it" when you're done!`;
      }
      return `Let's write to ${animal.name}! Just say what you want to tell them and I'll write it down. Say "send it" when you're done!`;
    }
    case 'receiving': {
      const animal = getAnimalById(ctx.nav.animalId);
      if (!animal) return null;
      return `Off it goes! I wonder what ${animal.name} will write back!`;
    }
    case 'reading': {
      const animal = getAnimalById(ctx.nav.animalId);
      if (!animal) return null;
      return `Oh look, a letter from ${animal.name}! Want me to read it to you?`;
    }
    default:
      return null;
  }
}

export function buildRichContext(ctx: SessionContext): string | null {
  switch (ctx.nav.view) {
    case 'mailbox':
      return [
        '[MAILBOX] The child is at the animal selection screen.',
        `Available pen pals: ${animals.map(a => `${a.emoji} ${a.name}`).join(', ')}`,
        'Encourage them to pick an animal to write to!',
      ].join('\n');
    case 'compose': {
      const animal = getAnimalById(ctx.nav.animalId);
      if (!animal) return null;
      const lines = [
        `[COMPOSE] The child is writing a letter to ${animal.name} (${animal.species}).`,
        `TRANSCRIPTION MODE: Write everything the child says using write_text. Do NOT ask for confirmation. Do NOT repeat back what they said. Just write it and stay quiet.`,
        `Only speak during long pauses to ask "Anything else, or should I send it?"`,
        `${animal.name}'s personality: ${animal.personality}`,
      ];
      const history = formatConversationHistory(ctx.thread, animal.name);
      if (history) {
        lines.push('', history, '');
        lines.push(`Use this history for context only if the child asks for help with ideas.`);
      }
      if (ctx.draft) {
        lines.push(`Current draft: "${ctx.draft}"`);
      }
      if (ctx.nav.threadId && ctx.nav.animalLetterCount && ctx.nav.animalLetterCount > 0) {
        lines.push(`Use read_previous_letter if the child asks to re-read a previous response.`);
      }
      return lines.join('\n');
    }
    case 'receiving': {
      const animal = getAnimalById(ctx.nav.animalId);
      if (!animal) return null;
      return `[LETTER SENT] The letter to ${animal.name} is flying away and ${animal.name} is writing back right now! Say something brief and excited, then STAY QUIET. The response is coming in a few seconds. Do NOT suggest going to the mailbox or picking another animal. Just wait.`;
    }
    case 'reading': {
      const animal = getAnimalById(ctx.nav.animalId);
      if (!animal) return null;
      const lines = [
        `[READING] The child is reading a letter from ${animal.name}.`,
      ];
      const history = formatConversationHistory(ctx.thread, animal.name);
      if (history) {
        lines.push('', history, '');
      }
      lines.push('Let them enjoy reading. If they want, they can write back or choose a different animal.');
      return lines.join('\n');
    }
    default:
      return null;
  }
}
