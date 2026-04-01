import { describe, it, expect } from 'vitest';
import { getAnimalVideo } from './videoManifest.ts';
import { animals } from './animals.ts';

describe('getAnimalVideo', () => {
  it('returns idle video for known animals', () => {
    for (const animal of animals) {
      const entry = getAnimalVideo(animal.id, 'idle');
      expect(entry, `${animal.id} should have idle video`).toBeDefined();
      expect(entry!.url).toContain(`${animal.id}_idle.mp4`);
    }
  });

  it('returns receive video for known animals', () => {
    for (const animal of animals) {
      const entry = getAnimalVideo(animal.id, 'receive');
      expect(entry, `${animal.id} should have receive video`).toBeDefined();
      expect(entry!.url).toContain(`${animal.id}_receive.mp4`);
    }
  });

  it('returns undefined for unknown animal', () => {
    expect(getAnimalVideo('unicorn', 'idle')).toBeUndefined();
  });

  it('video entries have required fields', () => {
    const entry = getAnimalVideo('elephant', 'idle');
    expect(entry).toHaveProperty('url');
    expect(entry).toHaveProperty('poster');
    expect(entry).toHaveProperty('description');
  });
});
