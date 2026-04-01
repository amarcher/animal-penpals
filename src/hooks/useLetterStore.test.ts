import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLetterStore } from './useLetterStore.ts';

describe('useLetterStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with empty threads', () => {
    const { result } = renderHook(() => useLetterStore());
    expect(result.current.threads).toEqual([]);
  });

  it('addLetter creates a new thread when no threadId given', () => {
    const { result } = renderHook(() => useLetterStore());
    act(() => {
      result.current.addLetter('elephant', 'child', 'Hello Ella!');
    });

    expect(result.current.threads).toHaveLength(1);
    expect(result.current.threads[0].animalId).toBe('elephant');
    expect(result.current.threads[0].letters).toHaveLength(1);
    expect(result.current.threads[0].letters[0].content).toBe('Hello Ella!');
    expect(result.current.threads[0].letters[0].from).toBe('child');
  });

  it('addLetter appends to existing thread', () => {
    const { result } = renderHook(() => useLetterStore());
    let threadId: string;

    act(() => {
      threadId = result.current.addLetter('dolphin', 'child', 'Hi Deena!').threadId;
    });

    act(() => {
      result.current.addLetter('dolphin', 'animal', 'Splash! Hi friend!', threadId!);
    });

    const thread = result.current.getThread(threadId!);
    expect(thread?.letters).toHaveLength(2);
    expect(thread?.letters[0].from).toBe('child');
    expect(thread?.letters[1].from).toBe('animal');
  });

  it('getThread returns correct thread', () => {
    const { result } = renderHook(() => useLetterStore());
    let threadId: string;

    act(() => {
      threadId = result.current.addLetter('fox', 'child', 'Hey Finn!').threadId;
    });

    expect(result.current.getThread(threadId!)).toBeDefined();
    expect(result.current.getThread('nonexistent')).toBeUndefined();
  });

  it('getThreadByAnimal returns thread for animal', () => {
    const { result } = renderHook(() => useLetterStore());

    act(() => {
      result.current.addLetter('owl', 'child', 'Hello Oliver!');
    });

    expect(result.current.getThreadByAnimal('owl')).toBeDefined();
    expect(result.current.getThreadByAnimal('bear')).toBeUndefined();
  });

  it('getUnreadCount counts only unread animal letters', () => {
    const { result } = renderHook(() => useLetterStore());
    let threadId: string;

    act(() => {
      threadId = result.current.addLetter('turtle', 'child', 'Hi Shelly!').threadId;
    });

    // Child letters are always read
    expect(result.current.getUnreadCount('turtle')).toBe(0);

    act(() => {
      result.current.addLetter('turtle', 'animal', 'Hello little one!', threadId!);
    });

    expect(result.current.getUnreadCount('turtle')).toBe(1);

    act(() => {
      result.current.addLetter('turtle', 'animal', 'How are you?', threadId!);
    });

    expect(result.current.getUnreadCount('turtle')).toBe(2);
  });

  it('markRead decrements unread count', () => {
    const { result } = renderHook(() => useLetterStore());
    let threadId: string;
    let letterId: string;

    act(() => {
      threadId = result.current.addLetter('parrot', 'child', 'Hi Polly!').threadId;
    });

    act(() => {
      letterId = result.current.addLetter('parrot', 'animal', 'SQUAWK!', threadId!).letterId;
    });

    expect(result.current.getUnreadCount('parrot')).toBe(1);

    act(() => {
      result.current.markRead(letterId!);
    });

    expect(result.current.getUnreadCount('parrot')).toBe(0);
  });

  it('getLetterById finds letter across threads', () => {
    const { result } = renderHook(() => useLetterStore());
    let letterId: string;

    act(() => {
      result.current.addLetter('elephant', 'child', 'Thread 1');
    });

    act(() => {
      letterId = result.current.addLetter('dolphin', 'child', 'Thread 2').letterId;
    });

    const letter = result.current.getLetterById(letterId!);
    expect(letter?.content).toBe('Thread 2');
    expect(letter?.animalId).toBe('dolphin');
  });

  it('getLetterById returns undefined for unknown id', () => {
    const { result } = renderHook(() => useLetterStore());
    expect(result.current.getLetterById('nonexistent')).toBeUndefined();
  });

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useLetterStore());

    act(() => {
      result.current.addLetter('bear', 'child', 'Hey Bruno!');
    });

    const stored = JSON.parse(localStorage.getItem('animal-penpals-threads')!);
    expect(stored).toHaveLength(1);
    expect(stored[0].animalId).toBe('bear');
  });

  it('loads existing data from localStorage', () => {
    const existingData = [{
      id: 'thread-1',
      animalId: 'fox',
      letters: [{
        id: 'letter-1',
        threadId: 'thread-1',
        animalId: 'fox',
        from: 'child',
        content: 'Saved letter',
        timestamp: Date.now(),
        read: true,
      }],
    }];
    localStorage.setItem('animal-penpals-threads', JSON.stringify(existingData));

    const { result } = renderHook(() => useLetterStore());
    expect(result.current.threads).toHaveLength(1);
    expect(result.current.threads[0].letters[0].content).toBe('Saved letter');
  });
});
