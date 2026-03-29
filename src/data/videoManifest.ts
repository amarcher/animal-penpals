export type VideoType = 'idle' | 'receive';

export interface AnimalVideoEntry {
  url: string;
  poster: string;
  description: string;
}

const BASE_URL = import.meta.env.VITE_VIDEO_CDN_URL || '/animal-videos';

const videoManifest: Record<string, AnimalVideoEntry> = {
  'bear-idle':        { url: `${BASE_URL}/bear_idle.mp4`,      poster: '', description: 'Bruno the Bear relaxing' },
  'bear-receive':     { url: `${BASE_URL}/bear_receive.mp4`,   poster: '', description: 'Bruno reads your letter and writes back' },
  'dolphin-idle':     { url: `${BASE_URL}/dolphin_idle.mp4`,   poster: '', description: 'Deena the Dolphin splashing happily' },
  'dolphin-receive':  { url: `${BASE_URL}/dolphin_receive.mp4`,poster: '', description: 'Deena reads your letter and writes back' },
  'elephant-idle':    { url: `${BASE_URL}/elephant_idle.mp4`,  poster: '', description: 'Ella the Elephant standing peacefully' },
  'elephant-receive': { url: `${BASE_URL}/elephant_receive.mp4`,poster: '', description: 'Ella reads your letter and writes back' },
  'fox-idle':         { url: `${BASE_URL}/fox_idle.mp4`,       poster: '', description: 'Finn the Fox looking clever' },
  'fox-receive':      { url: `${BASE_URL}/fox_receive.mp4`,    poster: '', description: 'Finn reads your letter and writes back' },
  'owl-idle':         { url: `${BASE_URL}/owl_idle.mp4`,       poster: '', description: 'Oliver the Owl perched wisely' },
  'owl-receive':      { url: `${BASE_URL}/owl_receive.mp4`,    poster: '', description: 'Oliver reads your letter and writes back' },
  'parrot-idle':      { url: `${BASE_URL}/parrot_idle.mp4`,    poster: '', description: 'Polly the Parrot showing off colors' },
  'parrot-receive':   { url: `${BASE_URL}/parrot_receive.mp4`, poster: '', description: 'Polly reads your letter and writes back' },
  'penguin-idle':     { url: `${BASE_URL}/penguin_idle.mp4`,   poster: '', description: 'Percy the Penguin waddling around' },
  'penguin-receive':  { url: `${BASE_URL}/penguin_receive.mp4`,poster: '', description: 'Percy reads your letter and writes back' },
  'turtle-idle':      { url: `${BASE_URL}/turtle_idle.mp4`,    poster: '', description: 'Shelly the Turtle resting calmly' },
  'turtle-receive':   { url: `${BASE_URL}/turtle_receive.mp4`, poster: '', description: 'Shelly reads your letter and writes back' },
  'otter-idle':       { url: `${BASE_URL}/otter_idle.mp4`,     poster: '', description: 'Ollie the Otter floating happily' },
  'otter-receive':    { url: `${BASE_URL}/otter_receive.mp4`,  poster: '', description: 'Ollie reads your letter and writes back' },
  'bee-idle':         { url: `${BASE_URL}/bee_idle.mp4`,       poster: '', description: 'Bea the Bee buzzing around flowers' },
  'bee-receive':      { url: `${BASE_URL}/bee_receive.mp4`,    poster: '', description: 'Bea reads your letter and writes back' },
  // Meerkat deferred — waiting for video generation credits
  // 'meerkat-idle':     { url: `${BASE_URL}/meerkat_idle.mp4`,   poster: '', description: 'Mika the Meerkat standing lookout' },
  // 'meerkat-receive':  { url: `${BASE_URL}/meerkat_receive.mp4`,poster: '', description: 'Mika reads your letter and writes back' },
  'shark-idle':       { url: `${BASE_URL}/shark_idle.mp4`,     poster: '', description: 'Gus the Great White swimming calmly' },
  'shark-receive':    { url: `${BASE_URL}/shark_receive.mp4`,  poster: '', description: 'Gus reads your letter and writes back' },
};

export function getAnimalVideo(animalId: string, type: VideoType): AnimalVideoEntry | undefined {
  return videoManifest[`${animalId}-${type}`];
}
