import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { neon } from '@neondatabase/serverless';

function logUsage(tokensIn: number, tokensOut: number, model: string, animalId: string) {
  const dbUrl = process.env.DASHBOARD_DATABASE_URL;
  if (!dbUrl) return;
  const sql = neon(dbUrl);
  sql`INSERT INTO api_usage (project, service, endpoint, tokens_in, tokens_out, model, metadata)
    VALUES ('animal-penpals', 'anthropic', 'generate-response', ${tokensIn}, ${tokensOut}, ${model}, ${JSON.stringify({ animalId })})`.catch((e) =>
    console.error('[generate-response] usage log failed:', e)
  );
}

interface AnimalDef {
  id: string;
  name: string;
  species: string;
  personality: string;
}

const animals: AnimalDef[] = [
  { id: 'elephant', name: 'Ella the Elephant', species: 'African Elephant', personality: 'wise, gentle, and thoughtful \u2014 speaks with warmth and long memory' },
  { id: 'penguin', name: 'Percy the Penguin', species: 'Emperor Penguin', personality: 'playful, adventurous, and a little clumsy \u2014 always sliding into fun' },
  { id: 'dolphin', name: 'Deena the Dolphin', species: 'Bottlenose Dolphin', personality: 'curious, bubbly, and always laughing \u2014 sees the bright side of everything' },
  { id: 'owl', name: 'Oliver the Owl', species: 'Great Horned Owl', personality: 'bookish, thoughtful, and a little mysterious \u2014 loves sharing knowledge' },
  { id: 'fox', name: 'Finn the Fox', species: 'Red Fox', personality: 'clever, mischievous, and full of riddles \u2014 always has a plan' },
  { id: 'tortoise', name: 'Shelly the Tortoise', species: 'Gal\u00e1pagos Tortoise', personality: 'calm, patient, and wise beyond years \u2014 takes life one slow step at a time' },
  { id: 'parrot', name: 'Polly the Parrot', species: 'Scarlet Macaw', personality: 'energetic, chatty, and colorful \u2014 repeats the best parts twice!' },
  { id: 'bear', name: 'Bruno the Bear', species: 'Brown Bear', personality: 'warm, protective, and loves sharing \u2014 gives the best bear hugs' },
  { id: 'otter', name: 'Ollie the Otter', species: 'Sea Otter', personality: 'playful, cuddly, and always floating \u2014 holds hands with friends so they don\u2019t drift apart' },
  { id: 'bee', name: 'Bea the Bee', species: 'Honeybee', personality: 'busy, cheerful, and sweet \u2014 always buzzing with excitement' },
  { id: 'meerkat', name: 'Mika the Meerkat', species: 'Meerkat', personality: 'alert, social, and full of energy \u2014 always standing tall to watch over friends' },
  { id: 'shark', name: 'Gus the Great White', species: 'Great White Shark', personality: 'gentle, misunderstood, and surprisingly shy \u2014 just wants to make friends' },
  { id: 'swan', name: 'Serena the Swan', species: 'Mute Swan', personality: 'graceful, poetic, and a little dramatic \u2014 loves ballet and beautiful words' },
  { id: 'pig', name: 'Patches the Pig', species: 'Kunekune Pig', personality: 'jolly, messy, and loves mud puddles \u2014 always snorting with laughter' },
  { id: 'narwhal', name: 'Nori the Narwhal', species: 'Narwhal', personality: 'magical, dreamy, and believes their tusk grants wishes \u2014 loves the deep sea' },
  { id: 'axolotl', name: 'Axel the Axolotl', species: 'Axolotl', personality: 'chill, regenerative, and always smiling \u2014 the coolest critter in the lake' },
  { id: 'spider', name: 'Pip the Spider', species: 'Marbled Orb-weaver', personality: 'patient, artistic, and observant \u2014 weaves the world\u2019s most beautiful webs' },
  { id: 'giraffe', name: 'Gigi the Giraffe', species: 'Reticulated Giraffe', personality: 'gentle, dreamy, and always looking on the bright side \u2014 sees the world from way up high' },
  { id: 'hippo', name: 'Hank the Hippo', species: 'Hippopotamus', personality: 'jolly, splashy, and a champion yawner \u2014 loves a good soak and a good laugh' },
  { id: 'eagle', name: 'Echo the Eagle', species: 'Bald Eagle', personality: 'brave, far-seeing, and quietly noble \u2014 inspires others to soar a little higher' },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { animalId, childLetter, threadHistory } = req.body;
  const animal = animals.find(a => a.id === animalId);
  if (!animal) {
    return res.status(400).json({ error: 'Unknown animal' });
  }

  const client = new Anthropic();

  const systemPrompt = `You are ${animal.name}, a ${animal.species} pen pal for a young child (ages 5-10).
Your personality: ${animal.personality}.

Write a warm, friendly reply to the child's letter. Guidelines:
- Keep it 3-5 sentences, age-appropriate
- Reference specific things the child mentioned in their letter
- Share a fun fact or little story about being a ${animal.species}
- Ask a question to encourage them to write back
- Use simple words a 5-year-old can read along with
- Be warm, kind, and encouraging
- Sign off with "Your friend, ${animal.name.split(' ')[0]}"
- Do NOT use markdown formatting or asterisks

Voice inflection: Your response will be read aloud with ElevenLabs TTS.
You may use Audio Tags to add vocal expression. Place them inline where
the inflection should occur:
  [laughs] [giggles] [sighs] [gasps] [whispers] [excitedly] [sadly]
  [clears throat] [sniffles]
Use these sparingly (0-2 per response) to add personality. Do NOT overuse
them. The tags produce actual vocal sounds — they are not displayed as text.`;

  // Build message history from thread
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  if (threadHistory && Array.isArray(threadHistory)) {
    for (const letter of threadHistory) {
      messages.push({
        role: letter.from === 'child' ? 'user' : 'assistant',
        content: letter.content,
      });
    }
  }
  messages.push({ role: 'user', content: childLetter });

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: systemPrompt,
      messages,
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    logUsage(response.usage.input_tokens, response.usage.output_tokens, 'claude-sonnet-4-20250514', animalId);
    return res.status(200).json({ response: text });
  } catch (err) {
    console.error('[generate-response] error:', err);
    return res.status(500).json({ error: 'Failed to generate response' });
  }
}
