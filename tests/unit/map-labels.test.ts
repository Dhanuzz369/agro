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

const groups = products.map((p) => ['bengaluru', ...p.ports, ...p.regions]);
const placed = placeLabels(pts, { width: W, height: H }, groups);

describe('placeLabels', () => {
  it('sizes boxes for the largest label font used on the map', () => {
    expect(placed.bengaluru.box.h).toBe(LABEL_FONT);
  });
  it('keeps every label inside the map', () => {
    for (const { box } of Object.values(placed)) {
      expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.w).toBeLessThanOrEqual(W);
      expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y + box.h).toBeLessThanOrEqual(H);
    }
  });
  it('never overlaps labels shown together for one product (HQ + its ports + its districts)', () => {
    for (const ids of groups) {
      for (const a of ids) for (const b of ids) {
        if (a < b) expect(overlap(placed[a].box, placed[b].box), `${a} × ${b}`).toBe(0);
      }
    }
  });
});
