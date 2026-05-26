export type MailReplyStatus =
  | 'drafting'
  | 'needs_parent_review'
  | 'parent_changes_requested'
  | 'approved'
  | 'rendered'
  | 'submitted_to_mail_vendor'
  | 'printing'
  | 'in_mail_stream'
  | 'delivered'
  | 'canceled'
  | 'failed';

export interface ThreadHistoryItem {
  from: 'child' | 'animal';
  content: string;
}

export interface MailReplyDraft {
  id: string;
  threadId: string;
  childLetterId: string;
  animalId: string;
  childLetter: string;
  threadHistory: ThreadHistoryItem[];
  draftText: string;
  parentGuidance: string;
  status: MailReplyStatus;
  qrToken?: string;
  createdAt: number;
  updatedAt: number;
  approvedAt?: number;
}

export interface CreateMailDraftInput {
  animalId: string;
  threadId: string;
  childLetterId: string;
  childLetter: string;
  parentGuidance?: string;
  threadHistory: ThreadHistoryItem[];
}

export interface PostalAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface VerifiedAddress {
  address: PostalAddress;
  deliverable: boolean;
  messages: string[];
}

export interface CreateLetterInput {
  to: PostalAddress;
  from: PostalAddress;
  pdfUrl: string;
  description: string;
  metadata: Record<string, string>;
}

export interface MailOrder {
  id: string;
  status: MailReplyStatus;
  proofUrl?: string;
  expectedDeliveryDate?: string;
  vendor: string;
}

export interface UpdateMailDraftInput {
  draftText?: string;
  parentGuidance?: string;
  status?: MailReplyStatus;
}
