import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const mockCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: mockCreate };
  },
}));

const { default: handler } = await import('./create-mail-draft.ts');

function mockReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return { method: 'POST', body: {}, ...overrides } as unknown as VercelRequest;
}

function mockRes() {
  const res = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) { res.statusCode = code; return res; },
    json(data: unknown) { res.body = data; return res; },
  };
  return res as unknown as VercelResponse & { statusCode: number; body: unknown };
}

describe('create-mail-draft API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 405 for non-POST requests', async () => {
    const res = mockRes();
    await handler(mockReq({ method: 'GET' }), res);
    expect(res.statusCode).toBe(405);
  });

  it('returns 400 for missing input', async () => {
    const res = mockRes();
    await handler(mockReq({ body: { animalId: 'fox' } }), res);
    expect(res.statusCode).toBe(400);
  });

  it('creates a physical mail draft with parent guidance', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Dear friend, I am writing from my den.' }],
    });

    const res = mockRes();
    await handler(mockReq({
      body: {
        animalId: 'fox',
        childLetter: 'I built a blanket fort.',
        parentGuidance: 'Encourage cleaning up after play.',
        threadHistory: [
          { from: 'child', content: 'Hi Finn!' },
          { from: 'animal', content: 'Hello from the woods!' },
        ],
      },
    }), res);

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      max_tokens: 420,
      system: expect.stringContaining('physical snail-mail letter'),
      messages: [expect.objectContaining({
        content: expect.stringContaining('Encourage cleaning up after play.'),
      })],
    }));
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ draft: 'Dear friend, I am writing from my den.' });
  });

  it('returns 500 on model errors', async () => {
    mockCreate.mockRejectedValue(new Error('model down'));

    const res = mockRes();
    await handler(mockReq({
      body: { animalId: 'fox', childLetter: 'Hi!' },
    }), res);

    expect(res.statusCode).toBe(500);
  });
});
