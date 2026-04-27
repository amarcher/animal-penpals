import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './tts.ts';

function mockReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return { method: 'POST', body: {}, ...overrides } as unknown as VercelRequest;
}

interface MockRes {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
  written: Buffer[];
  ended: boolean;
  status(code: number): MockRes;
  json(data: unknown): MockRes;
  setHeader(name: string, value: string): void;
  flushHeaders(): void;
  write(chunk: Buffer | string): boolean;
  end(): void;
  headersSent: boolean;
}

function mockRes(): MockRes {
  const res: MockRes = {
    statusCode: 200,
    body: null,
    headers: {},
    written: [],
    ended: false,
    headersSent: false,
    status(code) { res.statusCode = code; return res; },
    json(data) { res.body = data; return res; },
    setHeader(name, value) { res.headers[name] = value; },
    flushHeaders() { res.headersSent = true; },
    write(chunk) {
      res.headersSent = true;
      res.written.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      return true;
    },
    end() { res.ended = true; },
  };
  return res;
}

function streamFrom(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let i = 0;
  return new ReadableStream({
    pull(controller) {
      if (i < chunks.length) {
        controller.enqueue(encoder.encode(chunks[i++]));
      } else {
        controller.close();
      }
    },
  });
}

describe('tts API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 405 for non-POST requests', async () => {
    const res = mockRes();
    await handler(mockReq({ method: 'GET' }), res as unknown as VercelResponse);
    expect(res.statusCode).toBe(405);
  });

  it('returns 400 when text is missing', async () => {
    const res = mockRes();
    await handler(mockReq({ body: { voiceId: 'voice-1' } }), res as unknown as VercelResponse);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'Missing text or voiceId' });
  });

  it('returns 400 when voiceId is missing', async () => {
    const res = mockRes();
    await handler(mockReq({ body: { text: 'Hello' } }), res as unknown as VercelResponse);
    expect(res.statusCode).toBe(400);
  });

  it('returns 500 when API key not configured', async () => {
    const original = process.env.ELEVENLABS_API_KEY;
    delete process.env.ELEVENLABS_API_KEY;

    const res = mockRes();
    await handler(mockReq({ body: { text: 'Hello', voiceId: 'voice-1' } }), res as unknown as VercelResponse);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'ELEVENLABS_API_KEY not configured' });

    if (original) process.env.ELEVENLABS_API_KEY = original;
  });

  it('hits the streaming-with-timestamps endpoint and pipes the body through', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-key';
    const sseChunks = [
      'data: {"audio_base64":"AA","alignment":{}}\n\n',
      'data: {"audio_base64":"BB","alignment":{}}\n\n',
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: streamFrom(sseChunks),
    }));

    const res = mockRes();
    await handler(mockReq({ body: { text: 'Hello', voiceId: 'voice-1' } }), res as unknown as VercelResponse);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('voice-1/stream/with-timestamps'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'xi-api-key': 'test-key' }),
      }),
    );
    expect(res.headers['Content-Type']).toBe('text/event-stream');
    expect(res.ended).toBe(true);
    const piped = Buffer.concat(res.written).toString('utf8');
    expect(piped).toBe(sseChunks.join(''));

    delete process.env.ELEVENLABS_API_KEY;
  });

  it('returns error status from ElevenLabs failures', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      body: null,
      text: () => Promise.resolve('Rate limited'),
    }));

    const res = mockRes();
    await handler(mockReq({ body: { text: 'Hello', voiceId: 'voice-1' } }), res as unknown as VercelResponse);

    expect(res.statusCode).toBe(429);

    delete process.env.ELEVENLABS_API_KEY;
  });
});
