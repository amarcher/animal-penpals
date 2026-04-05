export type VideoType = 'idle' | 'receive';

export interface AnimalVideoEntry {
  url: string;
  poster: string;
  description: string;
}

const BASE_URL = import.meta.env.VITE_VIDEO_CDN_URL || '/animal-videos';
const THUMB_URL = import.meta.env.VITE_VIDEO_CDN_URL
  ? `${import.meta.env.VITE_VIDEO_CDN_URL}/animal-thumbnails`
  : '/animal-thumbnails';

const videoManifest: Record<string, AnimalVideoEntry> = {
  'bear-idle':        { url: `${BASE_URL}/bear_idle.mp4`,      poster: `${THUMB_URL}/bear_idle.jpg`,      description: 'Bruno the Bear relaxing' },
  'bear-receive':     { url: `${BASE_URL}/bear_receive.mp4`,   poster: `${THUMB_URL}/bear_receive.jpg`,   description: 'Bruno reads your letter and writes back' },
  'dolphin-idle':     { url: `${BASE_URL}/dolphin_idle.mp4`,   poster: `${THUMB_URL}/dolphin_idle.jpg`,   description: 'Deena the Dolphin splashing happily' },
  'dolphin-receive':  { url: `${BASE_URL}/dolphin_receive.mp4`,poster: `${THUMB_URL}/dolphin_receive.jpg`,description: 'Deena reads your letter and writes back' },
  'elephant-idle':    { url: `${BASE_URL}/elephant_idle.mp4`,  poster: `${THUMB_URL}/elephant_idle.jpg`,  description: 'Ella the Elephant standing peacefully' },
  'elephant-receive': { url: `${BASE_URL}/elephant_receive.mp4`,poster: `${THUMB_URL}/elephant_receive.jpg`,description: 'Ella reads your letter and writes back' },
  'fox-idle':         { url: `${BASE_URL}/fox_idle.mp4`,       poster: `${THUMB_URL}/fox_idle.jpg`,       description: 'Finn the Fox looking clever' },
  'fox-receive':      { url: `${BASE_URL}/fox_receive.mp4`,    poster: `${THUMB_URL}/fox_receive.jpg`,    description: 'Finn reads your letter and writes back' },
  'owl-idle':         { url: `${BASE_URL}/owl_idle.mp4`,       poster: `${THUMB_URL}/owl_idle.jpg`,       description: 'Oliver the Owl perched wisely' },
  'owl-receive':      { url: `${BASE_URL}/owl_receive.mp4`,    poster: `${THUMB_URL}/owl_receive.jpg`,    description: 'Oliver reads your letter and writes back' },
  'parrot-idle':      { url: `${BASE_URL}/parrot_idle.mp4`,    poster: `${THUMB_URL}/parrot_idle.jpg`,    description: 'Polly the Parrot showing off colors' },
  'parrot-receive':   { url: `${BASE_URL}/parrot_receive.mp4`, poster: `${THUMB_URL}/parrot_receive.jpg`, description: 'Polly reads your letter and writes back' },
  'penguin-idle':     { url: `${BASE_URL}/penguin_idle.mp4`,   poster: `${THUMB_URL}/penguin_idle.jpg`,   description: 'Percy the Penguin waddling around' },
  'penguin-receive':  { url: `${BASE_URL}/penguin_receive.mp4`,poster: `${THUMB_URL}/penguin_receive.jpg`,description: 'Percy reads your letter and writes back' },
  'tortoise-idle':    { url: `${BASE_URL}/turtle_idle.mp4`,    poster: `${THUMB_URL}/turtle_idle.jpg`,    description: 'Shelly the Tortoise resting calmly' },
  'tortoise-receive': { url: `${BASE_URL}/turtle_receive.mp4`, poster: `${THUMB_URL}/turtle_receive.jpg`, description: 'Shelly reads your letter and writes back' },
  'otter-idle':       { url: `${BASE_URL}/otter_idle.mp4`,     poster: `${THUMB_URL}/otter_idle.jpg`,     description: 'Ollie the Otter floating happily' },
  'otter-receive':    { url: `${BASE_URL}/otter_receive.mp4`,  poster: `${THUMB_URL}/otter_receive.jpg`,  description: 'Ollie reads your letter and writes back' },
  'bee-idle':         { url: `${BASE_URL}/bee_idle.mp4`,       poster: `${THUMB_URL}/bee_idle.jpg`,       description: 'Bea the Bee buzzing around flowers' },
  'bee-receive':      { url: `${BASE_URL}/bee_receive.mp4`,    poster: `${THUMB_URL}/bee_receive.jpg`,    description: 'Bea reads your letter and writes back' },
  'meerkat-idle':     { url: `${BASE_URL}/meerkat_idle.mp4`,   poster: `${THUMB_URL}/meerkat_idle.jpg`,   description: 'Mika the Meerkat standing lookout' },
  'meerkat-receive':  { url: `${BASE_URL}/meerkat_receive.mp4`,poster: `${THUMB_URL}/meerkat_receive.jpg`,description: 'Mika reads your letter and writes back' },
  'shark-idle':       { url: `${BASE_URL}/shark_idle.mp4`,     poster: `${THUMB_URL}/shark_idle.jpg`,     description: 'Gus the Great White swimming calmly' },
  'shark-receive':    { url: `${BASE_URL}/shark_receive.mp4`,  poster: `${THUMB_URL}/shark_receive.jpg`,  description: 'Gus reads your letter and writes back' },
};

export function getAnimalVideo(animalId: string, type: VideoType): AnimalVideoEntry | undefined {
  return videoManifest[`${animalId}-${type}`];
}
