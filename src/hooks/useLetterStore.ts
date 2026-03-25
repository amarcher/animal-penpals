import { useCallback, useEffect, useState } from 'react';
import type { Letter, Thread } from '../types/app.ts';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const STORAGE_KEY = 'animal-penpals-threads';

function loadThreads(): Thread[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function useLetterStore() {
  const [threads, setThreads] = useState<Thread[]>(loadThreads);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  }, [threads]);

  const addLetter = useCallback((
    animalId: string,
    from: 'child' | 'animal',
    content: string,
    threadId?: string,
  ): { threadId: string; letterId: string } => {
    const letterId = generateId();
    const letter: Letter = {
      id: letterId,
      threadId: threadId ?? '',
      animalId,
      from,
      content,
      timestamp: Date.now(),
      read: from === 'child',
    };

    let resolvedThreadId = threadId;

    setThreads(prev => {
      if (threadId) {
        return prev.map(t => {
          if (t.id !== threadId) return t;
          return { ...t, letters: [...t.letters, { ...letter, threadId }] };
        });
      }
      // Create new thread
      const newThreadId = generateId();
      resolvedThreadId = newThreadId;
      const newThread: Thread = {
        id: newThreadId,
        animalId,
        letters: [{ ...letter, threadId: newThreadId }],
      };
      return [...prev, newThread];
    });

    return { threadId: resolvedThreadId ?? generateId(), letterId };
  }, []);

  const getThread = useCallback((threadId: string): Thread | undefined => {
    return threads.find(t => t.id === threadId);
  }, [threads]);

  const getThreadByAnimal = useCallback((animalId: string): Thread | undefined => {
    return threads.find(t => t.animalId === animalId);
  }, [threads]);

  const getUnreadCount = useCallback((animalId: string): number => {
    const thread = threads.find(t => t.animalId === animalId);
    if (!thread) return 0;
    return thread.letters.filter(l => l.from === 'animal' && !l.read).length;
  }, [threads]);

  const markRead = useCallback((letterId: string) => {
    setThreads(prev => prev.map(t => ({
      ...t,
      letters: t.letters.map(l =>
        l.id === letterId ? { ...l, read: true } : l
      ),
    })));
  }, []);

  const getLetterById = useCallback((letterId: string): Letter | undefined => {
    for (const thread of threads) {
      const letter = thread.letters.find(l => l.id === letterId);
      if (letter) return letter;
    }
    return undefined;
  }, [threads]);

  return { threads, addLetter, getThread, getThreadByAnimal, getUnreadCount, markRead, getLetterById };
}
