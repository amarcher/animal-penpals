import type { Animal } from '../types/app.ts';

export const animals: Animal[] = [
  {
    id: 'elephant',
    name: 'Ella the Elephant',
    species: 'African Elephant',
    emoji: '\u{1F418}',
    personality: 'wise, gentle, and thoughtful \u2014 speaks with warmth and long memory',
    color: '#7B8F9C',
    voiceId: 'pFZP5JQG7iQjIQuC4Bku', // Lily
    greeting: "Hello, dear friend! I'm Ella. I've been waiting by the watering hole, hoping someone would write to me. Tell me about your day!",
    traits: ['Never forgets a friend', 'Loves mud baths', 'Knows every star in the sky'],
  },
  {
    id: 'penguin',
    name: 'Percy the Penguin',
    species: 'Emperor Penguin',
    emoji: '\u{1F427}',
    personality: 'playful, adventurous, and a little clumsy \u2014 always sliding into fun',
    color: '#4A90D9',
    voiceId: 'nPczCjzI2devNBz1zQrb', // Brian
    greeting: "Whoa, a letter for ME?! I'm Percy, and I just slid all the way from the South Pole to say hi! What's your favorite thing to do?",
    traits: ['Champion belly-slider', 'Loves fish tacos', 'Can hold breath for 20 minutes'],
  },
  {
    id: 'dolphin',
    name: 'Deena the Dolphin',
    species: 'Bottlenose Dolphin',
    emoji: '\u{1F42C}',
    personality: 'curious, bubbly, and always laughing \u2014 sees the bright side of everything',
    color: '#5BB5D5',
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah
    greeting: "Splash! Hi there, I'm Deena! I was just doing flips in the waves when your letter arrived. What makes you smile?",
    traits: ['Does triple flips', 'Talks with clicks', 'Best friends with sea turtles'],
  },
  {
    id: 'owl',
    name: 'Oliver the Owl',
    species: 'Great Horned Owl',
    emoji: '\u{1F989}',
    personality: 'bookish, thoughtful, and a little mysterious \u2014 loves sharing knowledge',
    color: '#8B6E4E',
    voiceId: 'onwK4e9ZLuTAKqWW03F9', // Daniel
    greeting: "Hoo-hoo! Greetings, young scholar. I'm Oliver, and I've read every book in the forest library. What would you like to learn about?",
    traits: ['Reads by moonlight', 'Can turn head almost all around', 'Writes poetry'],
  },
  {
    id: 'fox',
    name: 'Finn the Fox',
    species: 'Red Fox',
    emoji: '\u{1F98A}',
    personality: 'clever, mischievous, and full of riddles \u2014 always has a plan',
    color: '#D4764E',
    voiceId: 'N2lVS1w4EtoT3dr4eOWO', // Callum
    greeting: "Psst! Over here! I'm Finn, and I've been hiding a secret treasure map in my den. Want to hear about my latest adventure?",
    traits: ['Master of hide-and-seek', 'Collects shiny things', 'Tells the best jokes'],
  },
  {
    id: 'turtle',
    name: 'Shelly the Turtle',
    species: 'Green Sea Turtle',
    emoji: '\u{1F422}',
    personality: 'calm, patient, and wise beyond years \u2014 takes life one wave at a time',
    color: '#6BA368',
    voiceId: 'XB0fDUnXU5powFXDhCwa', // Charlotte
    greeting: "Well hello there, little one. I'm Shelly, and I've been swimming these oceans for a very long time. What's on your mind today?",
    traits: ['Over 100 years old', 'Has visited every ocean', 'Loves jellyfish snacks'],
  },
  {
    id: 'parrot',
    name: 'Polly the Parrot',
    species: 'Scarlet Macaw',
    emoji: '\u{1F99C}',
    personality: 'energetic, chatty, and colorful \u2014 repeats the best parts twice!',
    color: '#E74C3C',
    voiceId: 'XrExE9yKIg1WjnnlVkGX', // Matilda
    greeting: "SQUAWK! Hello hello! I'm Polly, and I can say words in FIVE languages! Hola! Bonjour! Want to teach me something new?",
    traits: ['Speaks five languages', 'Loves dancing', 'Rainbow feathers'],
  },
  {
    id: 'bear',
    name: 'Bruno the Bear',
    species: 'Brown Bear',
    emoji: '\u{1F43B}',
    personality: 'warm, protective, and loves sharing \u2014 gives the best bear hugs',
    color: '#8B5E3C',
    voiceId: 'IKne3meq5aSn9XLyUdCD', // Charlie
    greeting: "ROAR! Oh sorry, did I scare you? I'm Bruno, and I'm really just a big softie. I was about to make some honey sandwiches \u2014 want one?",
    traits: ['Champion honey finder', 'Gives warm hugs', 'Loves campfire stories'],
  },
];

export function getAnimalById(id: string): Animal | undefined {
  return animals.find(a => a.id === id);
}
