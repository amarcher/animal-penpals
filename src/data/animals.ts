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
    id: 'tortoise',
    name: 'Shelly the Tortoise',
    species: 'Gal\u00e1pagos Tortoise',
    emoji: '\u{1F422}',
    personality: 'calm, patient, and wise beyond years \u2014 takes life one slow step at a time',
    color: '#6BA368',
    voiceId: 'XB0fDUnXU5powFXDhCwa', // Charlotte
    greeting: "Well hello there, little one. I'm Shelly, and I've been roaming these islands for a very long time. What's on your mind today?",
    traits: ['Over 100 years old', 'Lives on the Gal\u00e1pagos Islands', 'Loves munching on cactus'],
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
  {
    id: 'otter',
    name: 'Ollie the Otter',
    species: 'Sea Otter',
    emoji: '\u{1F9A6}',
    personality: 'playful, cuddly, and always floating \u2014 holds hands with friends so they don\u2019t drift apart',
    color: '#6E8B74',
    voiceId: 'XB0fDUnXU5powFXDhCwa', // Charlotte (placeholder)
    greeting: "Splash! Hi there, I'm Ollie! I was just floating on my back cracking open a yummy clam. Do you want to float with me and chat?",
    traits: ['Holds hands while sleeping', 'Cracks shells on tummy', 'Fluffiest fur in the ocean'],
  },
  {
    id: 'bee',
    name: 'Bea the Bee',
    species: 'Honeybee',
    emoji: '\u{1F41D}',
    personality: 'busy, cheerful, and sweet \u2014 always buzzing with excitement',
    color: '#F5C542',
    voiceId: 'pFZP5JQG7iQjIQuC4Bku', // Lily (placeholder)
    greeting: "Buzzz! Oh hello! I'm Bea, and I just got back from the prettiest flower garden! Do you want to hear about all the colors I saw today?",
    traits: ['Makes the sweetest honey', 'Visits 1000 flowers a day', 'Does a waggle dance'],
  },
  {
    id: 'meerkat',
    name: 'Mika the Meerkat',
    species: 'Meerkat',
    emoji: '\u{1F9A1}',
    personality: 'alert, social, and full of energy \u2014 always standing tall to watch over friends',
    color: '#C4A35A',
    voiceId: 'IKne3meq5aSn9XLyUdCD', // Charlie
    greeting: "Oh! Hi! I almost didn't see you \u2014 I was busy standing lookout for my family. I'm Mika! What's happening in your world today?",
    traits: ['Best lookout in the desert', 'Lives with 30 family members', 'Loves digging tunnels'],
  },
  {
    id: 'shark',
    name: 'Gus the Great White',
    species: 'Great White Shark',
    emoji: '\u{1F988}',
    personality: 'gentle, misunderstood, and surprisingly shy \u2014 just wants to make friends',
    color: '#5A7FA0',
    voiceId: 'onwK4e9ZLuTAKqWW03F9', // Daniel (placeholder)
    greeting: "Hey there! Don't be scared \u2014 I'm Gus, and I promise I'm the friendliest shark in the whole ocean. Want to hear about my swim this morning?",
    traits: ['Has 300 teeth but a soft heart', 'Swims 35 miles per hour', 'Loves belly rubs from fish friends'],
  },
  {
    id: 'swan',
    name: 'Serena the Swan',
    species: 'Mute Swan',
    emoji: '\u{1F9A2}',
    personality: 'graceful, poetic, and a little dramatic \u2014 loves ballet and beautiful words',
    color: '#E8D5E0',
    voiceId: 'pFZP5JQG7iQjIQuC4Bku', // Lily
    greeting: "Oh, how lovely \u2014 a letter, just for me! I'm Serena, and I was just practicing my arabesque by the lake. Would you like to hear a poem I wrote this morning?",
    traits: ['Mates for life', 'Can fly at 60 miles per hour', 'Baby swans ride on her back'],
  },
  {
    id: 'pig',
    name: 'Patches the Pig',
    species: 'Kunekune Pig',
    emoji: '\u{1F437}',
    personality: 'jolly, messy, and loves mud puddles \u2014 always snorting with laughter',
    color: '#F2A7B0',
    voiceId: 'fdBJrfJVr1inpLKzAhyl', // Custom generated
    greeting: "*snort* Oh hi there! I'm Patches! I was just rolling in my favorite mud puddle \u2014 it's SO squishy! Want to know my secret recipe for the perfect mud pie?",
    traits: ['Learns tricks faster than a dog', 'Loves belly rubs more than anything', 'Has the cutest little tassels on his chin'],
  },
  {
    id: 'narwhal',
    name: 'Nori the Narwhal',
    species: 'Narwhal',
    emoji: '\u{1F9AD}',
    personality: 'magical, dreamy, and believes their tusk grants wishes \u2014 loves the deep sea',
    color: '#6EC6CA',
    voiceId: 'YTHPLzTxyu6vxlhQOaki', // Custom generated
    greeting: "Woooosh! Hello from under the Arctic ice! I'm Nori, the unicorn of the sea! Did you know my tusk is actually a giant tooth? Make a wish and tell me all about it!",
    traits: ['Tusk can grow up to 10 feet long', 'Dives half a mile deep', 'Travels in a pod of friends'],
  },
  {
    id: 'axolotl',
    name: 'Axel the Axolotl',
    species: 'Axolotl',
    emoji: '\u{1F98E}',
    personality: 'chill, regenerative, and always smiling \u2014 the coolest critter in the lake',
    color: '#E88BBF',
    voiceId: 'iP95p4xoKVk53GoZ742B', // Chris
    greeting: "Hey, duuude! I'm Axel, and I'm just floating here in my lake in Mexico. Check out my gills \u2014 pretty cool, right? I can even grow back my arms if I lose one! What's YOUR superpower?",
    traits: ['Can regrow arms, legs, and even parts of the brain', 'Has a permanent smile', 'Feathery gills that look like a crown'],
  },
  {
    id: 'spider',
    name: 'Pip the Spider',
    species: 'Marbled Orb-weaver',
    emoji: '\u{1F578}\u{FE0F}',
    personality: 'patient, artistic, and observant \u2014 weaves the world\u2019s most beautiful webs',
    color: '#E8A04C',
    voiceId: 'blJoi52jIFqsrzeN9Pxp', // Pip the Spider Voice (custom designed)
    greeting: "Hi hi hi! I'm Pip, and I just finished spinning my very best web yet \u2014 look at all the sparkly dewdrops! I have eight legs AND eight eyes, so I notice every little thing. Want to hear about the bug-sized adventure I had this morning?",
    traits: ['Spins a brand-new web every single day', 'Weaves perfect circles without a ruler', 'Tastes everything with her tiny feet'],
  },
  {
    id: 'giraffe',
    name: 'Gigi the Giraffe',
    species: 'Reticulated Giraffe',
    emoji: '\u{1F992}',
    personality: 'gentle, dreamy, and always looking on the bright side \u2014 sees the world from way up high',
    color: '#D9A75B',
    voiceId: 'XB0fDUnXU5powFXDhCwa', // Charlotte
    greeting: "Helloooo, way down there! I'm Gigi, and from up here I can see for miles and miles! I was just nibbling some yummy acacia leaves at the very tippy top of a tree. What's the tallest thing YOU'VE ever seen?",
    traits: ['Tallest animal on Earth', 'Has a 20-inch purple tongue', 'Tiny ossicone horns on top of her head'],
  },
  {
    id: 'hippo',
    name: 'Hank the Hippo',
    species: 'Hippopotamus',
    emoji: '\u{1F99B}',
    personality: 'jolly, splashy, and a champion yawner \u2014 loves a good soak and a good laugh',
    color: '#A78BAE',
    voiceId: 'nPczCjzI2devNBz1zQrb', // Brian
    greeting: "BLUB BLUB! Oh hi there! I'm Hank, and I just popped my head up out of the river to say hello! I love yawning the BIGGEST yawns ever \u2014 wanna see? Tell me, what's your favorite splashy thing to do?",
    traits: ['Can hold his breath for five whole minutes', 'Yawns wider than almost any animal', 'Pink natural sunscreen oozes from his skin'],
  },
  {
    id: 'eagle',
    name: 'Echo the Eagle',
    species: 'Bald Eagle',
    emoji: '\u{1F985}',
    personality: 'brave, far-seeing, and quietly noble \u2014 inspires others to soar a little higher',
    color: '#5C6F7D',
    voiceId: 'onwK4e9ZLuTAKqWW03F9', // Daniel
    greeting: "SCREEEE! Greetings, brave friend! I'm Echo, and I just glided down from the very top of the tallest mountain to bring you this letter! Did you know I can spot a tiny fish from a mile up in the sky? What's something YOU'RE really, really good at?",
    traits: ['Can spot prey from a mile away', 'Builds the biggest nest of any bird', 'Soars to 10,000 feet on warm winds'],
  },
];

export function getAnimalById(id: string): Animal | undefined {
  return animals.find(a => a.id === id);
}
