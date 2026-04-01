import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './tts.ts';

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

describe('tts API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 405 for non-POST requests', async () => {
    const res = mockRes();
    await handler(mockReq({ method: 'GET' }), res);
    expect(res.statusCode).toBe(405);
  });

  it('returns 400 when text is missing', async () => {
    const res = mockRes();
    await handler(mockReq({ body: { voiceId: 'voice-1' } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'Missing text or voiceId' });
  });

  it('returns 400 when voiceId is missing', async () => {
    const res = mockRes();
    await handler(mockReq({ body: { text: 'Hello' } }), res);
    expect(res.statusCode).toBe(400);
  });

  it('returns 500 when API key not configured', async () => {
    const original = process.env.ELEVENLABS_API_KEY;
    delete process.env.ELEVENLABS_API_KEY;

    const res = mockRes();
    await handler(mockReq({ body: { text: 'Hello', voiceId: 'voice-1' } }), res);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'ELEVENLABS_API_KEY not configured' });

    if (original) process.env.ELEVENLABS_API_KEY = original;
  });

  it('proxies to ElevenLabs and returns response', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-key';
    const mockData = { audio_base64: 'abc', alignment: {} };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }));

    const res = mockRes();
    await handler(mockReq({ body: { text: 'Hello', voiceId: 'voice-1' } }), res);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('voice-1/with-timestamps'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'xi-api-key': 'test-key' }),
      }),
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockData);

    delete process.env.ELEVENLABS_API_KEY;
  });

  it('returns error status from ElevenLabs failures', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: () => Promise.resolve('Rate limited'),
    }));

    const res = mockRes();
    await handler(mockReq({ body: { text: 'Hello', voiceId: 'voice-1' } }), res);

    expect(res.statusCode).toBe(429);

    delete process.env.ELEVENLABS_API_KEY;
  });
});
