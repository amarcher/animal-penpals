import type { CreateLetterInput, MailOrder, PostalAddress, VerifiedAddress } from '../types/mail.ts';

export interface MailVendor {
  verifyAddress(address: PostalAddress): Promise<VerifiedAddress>;
  createLetter(input: CreateLetterInput): Promise<MailOrder>;
  cancelLetter(orderId: string): Promise<void>;
  getLetter(orderId: string): Promise<MailOrder>;
}

export class MailVendorNotConfiguredError extends Error {
  constructor() {
    super('Mail vendor is not configured for this environment.');
    this.name = 'MailVendorNotConfiguredError';
  }
}
