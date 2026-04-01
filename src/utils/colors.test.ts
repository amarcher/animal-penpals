import { describe, it, expect } from 'vitest';
import { animalColors } from './colors.ts';
import { animals } from '../data/animals.ts';

describe('animalColors', () => {
  it('has an entry for every animal', () => {
    for (const animal of animals) {
      expect(animalColors[animal.id]).toBe(animal.color);
    }
  });

  it('all values are hex colors', () => {
    for (const color of Object.values(animalColors)) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
