import { describe, it, expect } from 'vitest';
import { animals, getAnimalById } from './animals.ts';

describe('animals data', () => {
  it('has no duplicate IDs', () => {
    const ids = animals.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every animal has required fields', () => {
    for (const animal of animals) {
      expect(animal.id).toBeTruthy();
      expect(animal.name).toBeTruthy();
      expect(animal.species).toBeTruthy();
      expect(animal.color).toMatch(/^#/);
      expect(animal.voiceId).toBeTruthy();
      expect(animal.emoji).toBeTruthy();
    }
  });
});

describe('getAnimalById', () => {
  it('returns the correct animal', () => {
    const ella = getAnimalById('elephant');
    expect(ella?.name).toBe('Ella the Elephant');
    expect(ella?.species).toBe('African Elephant');
  });

  it('returns undefined for unknown ID', () => {
    expect(getAnimalById('unicorn')).toBeUndefined();
  });

  it('works for every animal', () => {
    for (const animal of animals) {
      expect(getAnimalById(animal.id)).toBe(animal);
    }
  });
});
