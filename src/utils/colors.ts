import { animals } from '../data/animals.ts';

export const animalColors: Record<string, string> = Object.fromEntries(
  animals.map(a => [a.id, a.color])
);
