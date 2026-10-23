// tests/unit/geo.test.ts
import { describe, it, expect } from 'vitest';
import { servedCountries, routeHubs } from '../../src/data/countries';
import { worldPaths, worldArcs } from '../../src/lib/geo';

describe('countries', () => {
  it('lists at least 70 unique served countries', () => {
    expect(servedCountries.length).toBeGreaterThanOrEqual(70);
    expect(new Set(servedCountries.map((c) => c.id)).size).toBe(servedCountries.length);
  });
});

describe('geo', () => {
  it('produces world paths and flags served countries', () => {
    const paths = worldPaths(1000, 500, new Set(['784', '686']));
    expect(paths.length).toBeGreaterThan(150);
    expect(paths.filter((p) => p.served).map((p) => p.id).sort()).toEqual(['686', '784']);
  });
  it('produces one arc per hub', () => {
    const arcs = worldArcs(1000, 500, [77.59, 12.97], routeHubs.map((h) => [h.lon, h.lat]));
    expect(arcs).toHaveLength(routeHubs.length);
    for (const d of arcs) expect(d.startsWith('M')).toBe(true);
  });
  it('keeps inlined map markup small (short coordinates)', () => {
    const world = worldPaths(1000, 520, new Set()).reduce((n, p) => n + p.d.length, 0);
    expect(world).toBeLessThan(90_000);
  });
});
