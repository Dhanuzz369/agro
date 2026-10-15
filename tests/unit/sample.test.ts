import { describe, it, expect } from 'vitest';
import { sampleImage } from '../../src/scripts/particles/sample';

function img(w: number, h: number, fill: (x: number, y: number) => [number, number, number, number]) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) data.set(fill(x, y), (y * w + x) * 4);
  return { data, width: w, height: h };
}

describe('sampleImage', () => {
  it('returns exactly count points', () => {
    const r = sampleImage(img(10, 10, () => [255, 0, 0, 255]), 500);
    expect(r.positions.length).toBe(1500);
    expect(r.colors.length).toBe(1500);
  });
  it('maps colours to 0..1', () => {
    const r = sampleImage(img(4, 4, () => [255, 128, 0, 255]), 10);
    expect(r.colors[0]).toBeCloseTo(1);
    expect(r.colors[1]).toBeCloseTo(128 / 255);
    expect(r.colors[2]).toBeCloseTo(0);
  });
  it('ignores transparent pixels', () => {
    const r = sampleImage(img(10, 1, (x) => (x < 5 ? [0, 0, 0, 0] : [255, 255, 255, 255])), 200, { spread: 10 });
    // opaque pixels start at x = 5 (the centre); allow half a pixel of jitter
    for (let i = 0; i < 200; i++) expect(r.positions[i * 3]).toBeGreaterThanOrEqual(-0.5);
  });
  it('is deterministic for a seed', () => {
    const a = sampleImage(img(8, 8, (x, y) => [x * 30, y * 30, 0, 255]), 50, { seed: 7 });
    const b = sampleImage(img(8, 8, (x, y) => [x * 30, y * 30, 0, 255]), 50, { seed: 7 });
    expect(Array.from(a.positions)).toEqual(Array.from(b.positions));
  });
  it('returns zeros for a fully transparent image', () => {
    const r = sampleImage(img(4, 4, () => [0, 0, 0, 0]), 10);
    expect(r.positions.every((v) => v === 0)).toBe(true);
  });
});
