import type { LetterStore } from '../hooks/useLetterStore.ts';

export interface AppOutletContext {
  store: LetterStore;
  handleSelectAnimal: (animalId: string) => void;
  handleComposeSend: (content: string) => void;
  handleReceiveComplete: (animalResponse: string) => void;
  handleReply: () => void;
  handleReadLetter: (letterId: string) => void;
  handleDraftChange: (animalId: string, content: string) => void;
  handleMarkRead: () => void;
  handleTtsAutoPlayStarted: () => void;
  handleTtsAutoPlayFailed: () => void;
  handleTtsEnd: () => void;
  hasThread: (animalId: string) => boolean;
  goToMailbox: () => void;
}
