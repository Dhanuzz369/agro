import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';
import { places, type PlaceId } from '../../src/data/places';
import { projectSouth } from '../../src/lib/geo';
import { placeLabels, LABEL_FONT, type Box } from '../../src/lib/map-labels';

const W = 600, H = 700;
const pts = (Object.keys(places) as PlaceId[]).map((id) => {
  const [x, y] = projectSouth(W, H, [places[id].lon, places[id].lat]);
  return { id, x, y, label: places[id].name, kind: places[id].kind };
});
const overlap = (a: Box, b: Box) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

const products = readdirSync('src/content/products').map((f) => parse(readFileSync(`src/content/products/${f}`, 'utf8')) as { regions: PlaceId[]; ports: PlaceId[] });

// the same label sets SouthIndiaMap.astro uses: HQ + ports (About's 'hubs' view), and one per product
const hubs = pts.filter((p) => p.kind !== 'district').map((p) => p.id);
const groups = [hubs, ...products.map((p) => ['bengaluru', ...p.ports, ...p.regions])];
const { placed, usedFallback } = placeLabels(pts, { width: W, height: H }, groups);

describe('placeLabels', () => {
  it('finds a clean layout by search, without the greedy fallback', () => expect(usedFallback).toBe(false));
  it('backtracks without a stale candidate blocking its own alternatives', () => {
    // found by random search: solvable, but only after re-placing a label whose earlier side failed deeper
    const tight = [
      { id: 'p0', x: 20, y: 120, label: 'xxxxxx', kind: 'hq' as const },
      { id: 'p1', x: 95, y: 99, label: 'xxxxxxx', kind: 'port' as const },
      { id: 'p2', x: 71, y: 157, label: 'xxxx', kind: 'district' as const },
      { id: 'p3', x: 84, y: 82, label: 'xxxxxxxxx', kind: 'district' as const },
      { id: 'p4', x: 29, y: 93, label: 'xxxxxxxx', kind: 'district' as const },
    ];
    const r = placeLabels(tight, { width: 200, height: 200 });
    expect(r.usedFallback).toBe(false);
    const boxes = Object.values(r.placed).map((p) => p.box);
    for (const a of boxes) for (const b of boxes) if (a !== b) expect(overlap(a, b)).toBe(0);
  });
  it('sizes boxes for the largest label font used on the map', () => {
    expect(placed.bengaluru.box.h).toBe(LABEL_FONT);
  });
  it('keeps every label inside the map', () => {
    for (const { box } of Object.values(placed)) {
      expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.w).toBeLessThanOrEqual(W);
      expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y + box.h).toBeLessThanOrEqual(H);
    }
  });
  it('never overlaps labels shown together (About hubs view, and each product: HQ + its ports + its districts)', () => {
    for (const ids of groups) {
      for (const a of ids) for (const b of ids) {
        if (a < b) expect(overlap(placed[a].box, placed[b].box), `${a} × ${b}`).toBe(0);
      }
    }
  });
});
