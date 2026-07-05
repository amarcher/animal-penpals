import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock Anthropic SDK
const mockCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: mockCreate };
  },
}));

// Dynamic import after mock
const { default: handler } = await import('./generate-response.ts');

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

describe('generate-response API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 405 for non-POST requests', async () => {
    const res = mockRes();
    await handler(mockReq({ method: 'GET' }), res);
    expect(res.statusCode).toBe(405);
  });

  it('returns 400 for unknown animalId', async () => {
    const res = mockRes();
    await handler(mockReq({ body: { animalId: 'unicorn', childLetter: 'Hi!' } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'Unknown animal' });
  });

  it('calls Anthropic API with correct params', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Hello little one!' }],
      usage: { input_tokens: 10, output_tokens: 20 },
    });

    const res = mockRes();
    await handler(mockReq({
      body: {
        animalId: 'elephant',
        childLetter: 'Hi Ella!',
        threadHistory: [],
      },
    }), res);

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      model: expect.any(String),
      max_tokens: 400,
      system: expect.stringContaining('Ella the Elephant'),
      messages: [{ role: 'user', content: 'Hi Ella!' }],
    }));

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ response: 'Hello little one!' });
  });

  it('builds message history from threadHistory', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Response' }],
      usage: { input_tokens: 10, output_tokens: 20 },
    });

    const res = mockRes();
    await handler(mockReq({
      body: {
        animalId: 'dolphin',
        childLetter: 'Follow up!',
        threadHistory: [
          { from: 'child', content: 'First letter' },
          { from: 'animal', content: 'First response' },
        ],
      },
    }), res);

    const messages = mockCreate.mock.calls[0][0].messages;
    expect(messages).toEqual([
      { role: 'user', content: 'First letter' },
      { role: 'assistant', content: 'First response' },
      { role: 'user', content: 'Follow up!' },
    ]);
  });

  it('returns 500 on Anthropic API error', async () => {
    mockCreate.mockRejectedValue(new Error('API error'));

    const res = mockRes();
    await handler(mockReq({
      body: { animalId: 'elephant', childLetter: 'Hi!' },
    }), res);

    expect(res.statusCode).toBe(500);
  });
});
