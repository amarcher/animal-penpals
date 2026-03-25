import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          output_format: 'mp3_44100_128',
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('[tts] ElevenLabs error:', response.status, errText);
      return res.status(response.status).json({ error: 'TTS request failed' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('[tts] error:', err);
    return res.status(500).json({ error: 'TTS request failed' });
  }
}
