// Build-time label placement for the South India map. Labels are placed for the largest font
// size the map uses (see SouthIndiaMap.astro), so they cannot collide at smaller sizes either.

/** Largest label size in viewBox units (used while the map renders 400–480px wide). */
export const LABEL_FONT = 18;
const CHAR_W = 0.56; // average Manrope advance, in em
const GAP = 12; // distance from the dot centre to the label, in viewBox units

export type Box = { x: number; y: number; w: number; h: number };
export type Anchor = 'start' | 'end' | 'middle';
export interface Placement { dx: number; dy: string; anchor: Anchor; box: Box }
interface Pt { id: string; x: number; y: number; label: string; kind: 'hq' | 'port' | 'district' }

const priority = { hq: 0, port: 1, district: 2 } as const;

const overlap = (a: Box, b: Box) =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

function outside(b: Box, width: number, height: number) {
  const inner = overlap(b, { x: 0, y: 0, w: width, h: height });
  return b.w * b.h - inner;
}

function candidates(p: Pt): Placement[] {
  const h = LABEL_FONT;
  const w = p.label.length * CHAR_W * LABEL_FONT;
  return [
    { dx: GAP, dy: '0.35em', anchor: 'start', box: { x: p.x + GAP, y: p.y - h / 2, w, h } },
    { dx: -GAP, dy: '0.35em', anchor: 'end', box: { x: p.x - GAP - w, y: p.y - h / 2, w, h } },
    { dx: 0, dy: '1.6em', anchor: 'middle', box: { x: p.x - w / 2, y: p.y + GAP - 2, w, h } },
    { dx: 0, dy: '-0.9em', anchor: 'middle', box: { x: p.x - w / 2, y: p.y - GAP - h + 2, w, h } },
    // staggered: beside the dot but one line lower / higher
    { dx: GAP, dy: '1.15em', anchor: 'start', box: { x: p.x + GAP, y: p.y + h * 0.3, w, h } },
    { dx: -GAP, dy: '1.15em', anchor: 'end', box: { x: p.x - GAP - w, y: p.y + h * 0.3, w, h } },
    { dx: GAP, dy: '-0.45em', anchor: 'start', box: { x: p.x + GAP, y: p.y - h * 1.3, w, h } },
    { dx: -GAP, dy: '-0.45em', anchor: 'end', box: { x: p.x - GAP - w, y: p.y - h * 1.3, w, h } },
  ];
}

/**
 * Depth-first search (HQ first, then ports, then districts) for sides where no two labels that can be
 * visible together overlap and every label stays inside the map; within that, sides that cover fewer
 * dots are tried first. `groups` lists the label sets visible at the same time (one per product);
 * without groups every label avoids every other. If no clean layout exists, the least-overlapping
 * side per label is used and `usedFallback` is true.
 */
export function placeLabels(
  pts: Pt[], size: { width: number; height: number }, groups?: string[][],
): { placed: Record<string, Placement>; usedFallback: boolean } {
  const ordered = [...pts].sort((a, b) => priority[a.kind] - priority[b.kind]);
  const dots: (Box & { id: string })[] = pts.map((p) => ({ id: p.id, x: p.x - 9, y: p.y - 9, w: 18, h: 18 }));
  const together = (a: string, b: string) => !groups || groups.some((g) => g.includes(a) && g.includes(b));
  const options = ordered.map((p) =>
    candidates(p)
      .filter((c) => outside(c.box, size.width, size.height) < 0.5)
      .map((c) => ({ c, cost: dots.reduce((s, d) => (d.id === p.id ? s : s + overlap(c.box, d)), 0) }))
      .sort((a, b) => a.cost - b.cost)
      .map((o) => o.c),
  );
  const chosen: Placement[] = [];
  let steps = 0;
  // compare only with labels placed before i: chosen[i..] may still hold candidates from abandoned branches
  const fits = (i: number, c: Placement) =>
    chosen.slice(0, i).every((o, j) => !together(ordered[i].id, ordered[j].id) || overlap(c.box, o.box) < 0.5);
  const search = (i: number): boolean => {
    if (i === ordered.length) return true;
    for (const c of options[i]) {
      if (++steps > 200_000) return false;
      if (!fits(i, c)) continue;
      chosen[i] = c;
      if (search(i + 1)) return true;
    }
    chosen.length = i;
    return false;
  };
  const out: Record<string, Placement> = {};
  if (search(0)) {
    ordered.forEach((p, i) => { out[p.id] = chosen[i]; });
    return { placed: out, usedFallback: false };
  }
  // fallback: greedy least overlap
  for (const [i, p] of ordered.entries()) {
    const all = options[i].length ? options[i] : candidates(p);
    let best = all[0];
    let bestScore = Infinity;
    for (const c of all) {
      const sc = Object.entries(out).reduce((s, [id, o]) => (together(p.id, id) ? s + overlap(c.box, o.box) : s), 0);
      if (sc < bestScore) { best = c; bestScore = sc; }
    }
    out[p.id] = best;
  }
  return { placed: out, usedFallback: true };
}
