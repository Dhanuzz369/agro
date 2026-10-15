import { describe, it, expect } from 'vitest';
import { grainSpec, scatterPile } from '../../src/scripts/product-object/grains';

describe('grainSpec', () => {
  it('rice is elongated', () => {
    const s = grainSpec('rice');
    expect(s.scale[0]).toBeGreaterThan(s.scale[1] * 2);
  });
  it('every kind has a positive count under 2500', () => {
    for (const k of ['rice', 'brokenRice', 'groundnut', 'arecanut', 'turmeric', 'ginger', 'jaggery', 'copra'] as const) {
      const s = grainSpec(k);
      expect(s.count).toBeGreaterThan(0);
      expect(s.count).toBeLessThanOrEqual(2500);
    }
  });
});

describe('scatterPile', () => {
  it('returns 4 floats per instance', () => expect(scatterPile(100, 1).length).toBe(400));
  it('is deterministic', () => expect(Array.from(scatterPile(50, 3))).toEqual(Array.from(scatterPile(50, 3))));
  it('keeps points inside the radius and above the floor', () => {
    const p = scatterPile(500, 2, 1.5);
    for (let i = 0; i < 500; i++) {
      expect(Math.hypot(p[i * 4], p[i * 4 + 2])).toBeLessThanOrEqual(1.5 + 1e-6);
      expect(p[i * 4 + 1]).toBeGreaterThanOrEqual(0);
    }
  });
  it('is higher at the centre than at the rim', () => {
    const p = scatterPile(2000, 4, 1.5);
    let inner = 0, innerN = 0, outer = 0, outerN = 0;
    for (let i = 0; i < 2000; i++) {
      const r = Math.hypot(p[i * 4], p[i * 4 + 2]);
      if (r < 0.5) { inner += p[i * 4 + 1]; innerN++; } else if (r > 1.1) { outer += p[i * 4 + 1]; outerN++; }
    }
    expect(inner / innerN).toBeGreaterThan(outer / outerN);
  });
});
