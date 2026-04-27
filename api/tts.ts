import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

function logUsage(characters: number, voiceId: string) {
  const dbUrl = process.env.DASHBOARD_DATABASE_URL;
  if (!dbUrl) return;
  const sql = neon(dbUrl);
  sql`INSERT INTO api_usage (project, service, endpoint, characters, metadata)
    VALUES ('animal-penpals', 'elevenlabs', 'tts', ${characters}, ${JSON.stringify({ voiceId })})`.catch((e) =>
    console.error('[tts] usage log failed:', e)
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, voiceId } = req.body;

  if (!text || !voiceId) {
    return res.status(400).json({ error: 'Missing text or voiceId' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured' });
  }

  try {
    // Stream-with-timestamps returns SSE: each event is JSON with audio_base64
    // (a chunk) + alignment (character timings for that chunk). We pipe the raw
    // bytes through unchanged — the client parses the SSE stream and feeds the
    // audio chunks into a MediaSource so playback can start before the full
    // generation finishes.
    const elevenResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream/with-timestamps`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_v3',
          output_format: 'mp3_44100_128',
        }),
      }
    );

    if (!elevenResponse.ok || !elevenResponse.body) {
      const errText = await elevenResponse.text();
      console.error('[tts] ElevenLabs error:', elevenResponse.status, errText);
      return res.status(elevenResponse.status).json({ error: 'TTS request failed' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no'); // disable proxy buffering
    res.flushHeaders?.();

    const reader = elevenResponse.body.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }

    logUsage(text.length, voiceId);
    res.end();
  } catch (err) {
    console.error('[tts] error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'TTS request failed' });
    } else {
      res.end();
    }
  }
}
