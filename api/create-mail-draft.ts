import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { getAnimalById } from '../src/data/animals.ts';

interface ThreadHistoryItem {
  from: 'child' | 'animal';
  content: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { animalId, childLetter, threadHistory } = req.body as {
    animalId?: string;
    childLetter?: string;
    parentGuidance?: string;
    threadHistory?: ThreadHistoryItem[];
  };
  const { parentGuidance } = req.body as { parentGuidance?: string };

  if (!animalId || !childLetter) {
    return res.status(400).json({ error: 'Missing animalId or childLetter' });
  }

  const animal = getAnimalById(animalId);
  if (!animal) {
    return res.status(400).json({ error: 'Unknown animal' });
  }

  const history = Array.isArray(threadHistory)
    ? threadHistory.slice(-8).map(item => `${item.from === 'child' ? 'Child' : animal.name}: ${item.content}`).join('\n')
    : 'No previous letters yet.';

  const system = `You are ${animal.name}, a ${animal.species} pen pal for a young child.
Your personality is ${animal.personality}.

Write a physical snail-mail letter that a parent will review before it is sent. Guidelines:
- 120-180 words
- Warm, concrete, and easy for a 5-10 year old to read with help
- Reference something specific from the child's letter
- Include one tiny story from your animal world
- Include one gentle growth idea, framed as animal wisdom rather than correction
- Ask one inviting question so the child wants to write back
- Sign the letter as "Your friend, ${animal.name.split(' ')[0]}"
- Do not use markdown, audio tags, or stage directions`;

  const guidance = parentGuidance?.trim()
    ? `\n\nParent private guidance to weave in gently: ${parentGuidance.trim()}`
    : '';

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 420,
      system,
      messages: [{
        role: 'user',
        content: `Previous letters:\n${history}\n\nChild's newest letter:\n${childLetter}${guidance}`,
      }],
    });

    const draft = response.content[0]?.type === 'text' ? response.content[0].text : '';
    return res.status(200).json({ draft });
  } catch (err) {
    console.error('[create-mail-draft] error:', err);
    return res.status(500).json({ error: 'Failed to create mail draft' });
  }
}
