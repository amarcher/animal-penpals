import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNavigation } from './useNavigation.ts';

describe('useNavigation', () => {
  it('starts at mailbox', () => {
    const { result } = renderHook(() => useNavigation());
    expect(result.current.nav).toEqual({ view: 'mailbox' });
  });

  it('goToCompose sets compose view with animalId', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.goToCompose('elephant'));
    expect(result.current.nav).toEqual({ view: 'compose', animalId: 'elephant', threadId: undefined, animalLetterCount: undefined });
  });

  it('goToCompose includes optional threadId', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.goToCompose('dolphin', 'thread-1'));
    expect(result.current.nav).toEqual({ view: 'compose', animalId: 'dolphin', threadId: 'thread-1', animalLetterCount: undefined });
  });

  it('goToCompose includes optional animalLetterCount', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.goToCompose('dolphin', 'thread-1', 3));
    expect(result.current.nav).toEqual({ view: 'compose', animalId: 'dolphin', threadId: 'thread-1', animalLetterCount: 3 });
  });

  it('goToSending sets sending view with letter content', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.goToSending('fox', 'thread-1', 'Hello fox!'));
    expect(result.current.nav).toEqual({
      view: 'sending',
      animalId: 'fox',
      threadId: 'thread-1',
      letterContent: 'Hello fox!',
    });
  });

  it('goToReceiving sets receiving view', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.goToReceiving('owl', 'thread-1'));
    expect(result.current.nav).toEqual({ view: 'receiving', animalId: 'owl', threadId: 'thread-1' });
  });

  it('goToReading sets reading view', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.goToReading('bear', 'letter-1', 'thread-1'));
    expect(result.current.nav).toEqual({
      view: 'reading',
      animalId: 'bear',
      letterId: 'letter-1',
      threadId: 'thread-1',
    });
  });

  it('goToMailbox resets to mailbox', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.goToCompose('elephant'));
    act(() => result.current.goToMailbox());
    expect(result.current.nav).toEqual({ view: 'mailbox' });
  });

  it('full state machine cycle', () => {
    const { result } = renderHook(() => useNavigation());

    act(() => result.current.goToCompose('penguin'));
    expect(result.current.nav.view).toBe('compose');

    act(() => result.current.goToSending('penguin', 'thread-1', 'Hi Percy!'));
    expect(result.current.nav.view).toBe('sending');

    act(() => result.current.goToReceiving('penguin', 'thread-1'));
    expect(result.current.nav.view).toBe('receiving');

    act(() => result.current.goToReading('penguin', 'letter-1', 'thread-1'));
    expect(result.current.nav.view).toBe('reading');

    act(() => result.current.goToMailbox());
    expect(result.current.nav.view).toBe('mailbox');
  });
});
