export interface Animal {
  id: string;
  name: string;
  species: string;
  emoji: string;
  personality: string;
  color: string;
  voiceId: string;
  greeting: string;
  traits: string[];
}

export interface Letter {
  id: string;
  threadId: string;
  animalId: string;
  from: 'child' | 'animal';
  content: string;
  timestamp: number;
  read: boolean;
}

export interface Thread {
  id: string;
  animalId: string;
  letters: Letter[];
}

export type AppState =
  | { view: 'mailbox' }
  | { view: 'compose'; animalId: string; threadId?: string; animalLetterCount?: number }
  | { view: 'sending'; animalId: string; threadId: string; letterContent: string }
  | { view: 'receiving'; animalId: string; threadId: string }
  | { view: 'reading'; animalId: string; letterId: string; threadId: string };
