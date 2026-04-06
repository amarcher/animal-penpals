import { describe, it, expect } from 'vitest';
import type { Thread } from '../types/app.ts';
import {
  formatConversationHistory,
  buildFirstMessage,
  buildRichContext,
  type SessionContext,
} from './usePenpalConversation.ts';

const makeThread = (letters: Array<{ from: 'child' | 'animal'; content: string }>): Thread => ({
  id: 'thread-1',
  animalId: 'elephant',
  letters: letters.map((l, i) => ({
    id: `letter-${i}`,
    threadId: 'thread-1',
    animalId: 'elephant',
    from: l.from,
    content: l.content,
    timestamp: Date.now() + i * 1000,
    read: true,
  })),
});

describe('formatConversationHistory', () => {
  it('returns null for undefined thread', () => {
    expect(formatConversationHistory(undefined, 'Ella')).toBeNull();
  });

  it('returns null for empty thread', () => {
    expect(formatConversationHistory(makeThread([]), 'Ella')).toBeNull();
  });

  it('formats a thread with multiple letters', () => {
    const thread = makeThread([
      { from: 'child', content: 'Hi Ella!' },
      { from: 'animal', content: 'Hello dear friend!' },
      { from: 'child', content: 'Do you like mud baths?' },
    ]);
    const result = formatConversationHistory(thread, 'Ella');
    expect(result).toContain('[CONVERSATION HISTORY with Ella]');
    expect(result).toContain('Child: "Hi Ella!"');
    expect(result).toContain('Ella: "Hello dear friend!"');
    expect(result).toContain('Child: "Do you like mud baths?"');
  });
});

describe('buildFirstMessage', () => {
  it('returns mailbox greeting', () => {
    const ctx: SessionContext = { nav: { view: 'mailbox' }, draft: '', thread: undefined };
    const msg = buildFirstMessage(ctx);
    expect(msg).toContain('animal friend');
  });

  it('returns compose greeting with transcription instructions (no thread)', () => {
    const ctx: SessionContext = {
      nav: { view: 'compose', animalId: 'elephant' },
      draft: '',
      thread: undefined,
    };
    const msg = buildFirstMessage(ctx);
    expect(msg).toContain('Ella the Elephant');
    expect(msg).toContain('send it');
  });

  it('returns compose greeting referencing existing draft', () => {
    const ctx: SessionContext = {
      nav: { view: 'compose', animalId: 'elephant' },
      draft: 'Dear Ella, I like elephants',
      thread: undefined,
    };
    const msg = buildFirstMessage(ctx);
    expect(msg).toContain('Ella the Elephant');
    expect(msg).toContain('listening');
  });

  it('returns compose greeting referencing prior conversation', () => {
    const thread = makeThread([
      { from: 'child', content: 'Hi!' },
      { from: 'animal', content: 'Hello!' },
    ]);
    const ctx: SessionContext = {
      nav: { view: 'compose', animalId: 'elephant' },
      draft: '',
      thread,
    };
    const msg = buildFirstMessage(ctx);
    expect(msg).toContain('Ella the Elephant');
    expect(msg).toContain('send it');
  });

  it('returns sending greeting', () => {
    const ctx: SessionContext = {
      nav: { view: 'sending', animalId: 'elephant', threadId: 't1', letterContent: 'Hi!' },
      draft: '',
      thread: undefined,
    };
    const msg = buildFirstMessage(ctx);
    expect(msg).toContain('Ella the Elephant');
    expect(msg).toContain('write back');
  });

  it('returns reading greeting', () => {
    const ctx: SessionContext = {
      nav: { view: 'reading', animalId: 'elephant', letterId: 'l1', threadId: 't1' },
      draft: '',
      thread: undefined,
    };
    const msg = buildFirstMessage(ctx);
    expect(msg).toContain('Ella the Elephant');
    expect(msg).toContain('letter');
  });

  it('returns null for unknown animal', () => {
    const ctx: SessionContext = {
      nav: { view: 'compose', animalId: 'unicorn' },
      draft: '',
      thread: undefined,
    };
    expect(buildFirstMessage(ctx)).toBeNull();
  });
});

describe('buildRichContext', () => {
  it('includes available animals for mailbox view', () => {
    const ctx: SessionContext = { nav: { view: 'mailbox' }, draft: '', thread: undefined };
    const result = buildRichContext(ctx);
    expect(result).toContain('[MAILBOX]');
    expect(result).toContain('Ella');
  });

  it('includes transcription mode for compose view', () => {
    const ctx: SessionContext = {
      nav: { view: 'compose', animalId: 'elephant' },
      draft: '',
      thread: undefined,
    };
    const result = buildRichContext(ctx);
    expect(result).toContain('[COMPOSE]');
    expect(result).toContain('TRANSCRIPTION MODE');
    expect(result).toContain('write_text');
  });

  it('includes draft content in compose context', () => {
    const ctx: SessionContext = {
      nav: { view: 'compose', animalId: 'elephant' },
      draft: 'I love elephants!',
      thread: undefined,
    };
    const result = buildRichContext(ctx);
    expect(result).toContain('Current draft: "I love elephants!"');
  });

  it('includes conversation history in compose context', () => {
    const thread = makeThread([
      { from: 'child', content: 'Hi Ella!' },
      { from: 'animal', content: 'Hello dear!' },
    ]);
    const ctx: SessionContext = {
      nav: { view: 'compose', animalId: 'elephant', threadId: 'thread-1', animalLetterCount: 1 },
      draft: '',
      thread,
    };
    const result = buildRichContext(ctx);
    expect(result).toContain('[CONVERSATION HISTORY with Ella the Elephant]');
    expect(result).toContain('Child: "Hi Ella!"');
    expect(result).toContain('Ella the Elephant: "Hello dear!"');
    expect(result).toContain('read_previous_letter');
  });

  it('includes conversation history in reading context', () => {
    const thread = makeThread([
      { from: 'child', content: 'Hi!' },
      { from: 'animal', content: 'Hello!' },
    ]);
    const ctx: SessionContext = {
      nav: { view: 'reading', animalId: 'elephant', letterId: 'l1', threadId: 'thread-1' },
      draft: '',
      thread,
    };
    const result = buildRichContext(ctx);
    expect(result).toContain('[READING]');
    expect(result).toContain('[CONVERSATION HISTORY with Ella the Elephant]');
  });

  it('returns sending context that tells agent to wait', () => {
    const ctx: SessionContext = {
      nav: { view: 'sending', animalId: 'elephant', threadId: 't1', letterContent: 'Hi!' },
      draft: '',
      thread: undefined,
    };
    const result = buildRichContext(ctx);
    expect(result).toContain('[SENDING]');
    expect(result).toContain('Ella the Elephant');
    expect(result).toContain('STAY QUIET');
    expect(result).toContain('Do NOT suggest');
  });

  it('returns null for unknown animal in compose', () => {
    const ctx: SessionContext = {
      nav: { view: 'compose', animalId: 'unicorn' },
      draft: '',
      thread: undefined,
    };
    expect(buildRichContext(ctx)).toBeNull();
  });
});
