import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'animal-penpals-mailbox-mode';
const listeners = new Set<() => void>();

function readEnabled(): boolean {
  if (import.meta.env.VITE_MAILBOX_MODE === 'true') return true;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function isMailboxModeEnabled(): boolean {
  return readEnabled();
}

export function setMailboxModeEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY, String(enabled));
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useMailboxMode(): [boolean, (enabled: boolean) => void] {
  const enabled = useSyncExternalStore(subscribe, readEnabled, () => false);
  return [enabled, setMailboxModeEnabled];
}
