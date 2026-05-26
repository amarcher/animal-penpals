import type { LetterStore } from '../hooks/useLetterStore.ts';
import type { ParentReviewStore } from '../hooks/useParentReviewStore.ts';

export interface AppOutletContext {
  store: LetterStore;
  reviewStore: ParentReviewStore;
  handleSelectAnimal: (animalId: string) => void;
  handleComposeSend: (content: string) => void;
  handleSendComplete: (responsePromise: Promise<string>) => void;
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
