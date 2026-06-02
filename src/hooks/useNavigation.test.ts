import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { createElement, type ReactNode } from 'react';
import { TransitionProvider } from '../contexts/TransitionContext.tsx';
import { useNavigation } from './useNavigation.ts';

function createHookWrapper(initialPath = '/mailbox') {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(TransitionProvider, null,
      createElement(MemoryRouter, { initialEntries: [initialPath] },
        createElement(Routes, null,
          createElement(Route, { path: 'mailbox', element: children }),
          createElement(Route, { path: 'compose/:animalId', element: children }),
          createElement(Route, { path: 'sending/:animalId/:threadId', element: children }),
          createElement(Route, { path: 'receiving/:animalId/:threadId', element: children }),
          createElement(Route, { path: 'reading/:animalId/:letterId', element: children }),
          createElement(Route, { path: 'mailbox-sent/:animalId/:threadId', element: children }),
          createElement(Route, { path: 'mail-journey/:animalId/:threadId', element: children }),
        )
      )
    );
  };
}

describe('useNavigation', () => {
  it('starts at mailbox', () => {
    const { result } = renderHook(() => useNavigation(), {
      wrapper: createHookWrapper('/mailbox'),
    });
    expect(result.current.nav).toEqual({ view: 'mailbox' });
  });

  it('goToCompose sets compose view with animalId', () => {
    const { result } = renderHook(() => useNavigation(), {
      wrapper: createHookWrapper('/mailbox'),
    });
    act(() => result.current.goToCompose('elephant'));
    expect(result.current.nav).toMatchObject({ view: 'compose', animalId: 'elephant' });
  });

  it('goToCompose includes optional threadId', () => {
    const { result } = renderHook(() => useNavigation(), {
      wrapper: createHookWrapper('/mailbox'),
    });
    act(() => result.current.goToCompose('dolphin', 'thread-1'));
    expect(result.current.nav).toMatchObject({ view: 'compose', animalId: 'dolphin', threadId: 'thread-1' });
  });

  it('goToCompose includes optional animalLetterCount', () => {
    const { result } = renderHook(() => useNavigation(), {
      wrapper: createHookWrapper('/mailbox'),
    });
    act(() => result.current.goToCompose('dolphin', 'thread-1', 3));
    expect(result.current.nav).toMatchObject({
      view: 'compose',
      animalId: 'dolphin',
      threadId: 'thread-1',
      animalLetterCount: 3,
    });
  });

  it('goToSending sets sending view with letter content', () => {
    const { result } = renderHook(() => useNavigation(), {
      wrapper: createHookWrapper('/mailbox'),
    });
    act(() => result.current.goToSending('fox', 'thread-1', 'Hello fox!'));
    expect(result.current.nav).toMatchObject({
      view: 'sending',
      animalId: 'fox',
      threadId: 'thread-1',
      letterContent: 'Hello fox!',
    });
  });

  it('goToReceiving sets receiving view', () => {
    const { result } = renderHook(() => useNavigation(), {
      wrapper: createHookWrapper('/mailbox'),
    });
    act(() => result.current.goToReceiving('owl', 'thread-1'));
    expect(result.current.nav).toEqual({ view: 'receiving', animalId: 'owl', threadId: 'thread-1' });
  });

  it('goToReading sets reading view', () => {
    const { result } = renderHook(() => useNavigation(), {
      wrapper: createHookWrapper('/mailbox'),
    });
    act(() => result.current.goToReading('bear', 'letter-1', 'thread-1'));
    expect(result.current.nav).toEqual({
      view: 'reading',
      animalId: 'bear',
      letterId: 'letter-1',
      threadId: 'thread-1',
    });
  });

  it('goToMailboxSent sets mailbox-sent view', () => {
    const { result } = renderHook(() => useNavigation(), {
      wrapper: createHookWrapper('/mailbox'),
    });
    act(() => result.current.goToMailboxSent('fox', 'thread-1'));
    expect(result.current.nav).toEqual({
      view: 'mailbox-sent',
      animalId: 'fox',
      threadId: 'thread-1',
    });
  });

  it('goToMailJourney navigates to journey route', () => {
    const { result } = renderHook(() => useNavigation(), {
      wrapper: createHookWrapper('/mailbox'),
    });
    act(() => result.current.goToMailJourney('owl', 'thread-1'));
    expect(result.current.nav).toEqual({
      view: 'mail-journey',
      animalId: 'owl',
      threadId: 'thread-1',
    });
  });

  it('goToMailbox resets to mailbox', () => {
    const { result } = renderHook(() => useNavigation(), {
      wrapper: createHookWrapper('/compose/elephant'),
    });
    expect(result.current.nav.view).toBe('compose');
    act(() => result.current.goToMailbox());
    expect(result.current.nav).toEqual({ view: 'mailbox' });
  });

  it('full state machine cycle', () => {
    const { result } = renderHook(() => useNavigation(), {
      wrapper: createHookWrapper('/mailbox'),
    });

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
