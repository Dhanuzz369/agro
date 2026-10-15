import type { APIRoute } from 'astro';
import { servedCountries } from '../../data/countries';
import { worldPaths } from '../../lib/geo';
import { WORLD_W, WORLD_H } from '../../lib/world-map-size';

// The country shapes are the heavy part of the world map (~80 KB), so they ship as a lazily loaded
// image instead of inline markup on every home page; the animated arcs stay inline (WorldMap.astro).
export const GET: APIRoute = () => {
  const served = new Set(servedCountries.map((c) => c.id));
  const paths = worldPaths(WORLD_W, WORLD_H, served);
  const off = paths.filter((p) => !p.served).map((p) => p.d).join('');
  const on = paths.filter((p) => p.served).map((p) => p.d).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WORLD_W} ${WORLD_H}" width="${WORLD_W}" height="${WORLD_H}">`
    + `<g stroke="rgb(246 241 231 / 0.18)" stroke-width="0.4" stroke-linejoin="round">`
    + `<path fill="rgb(246 241 231 / 0.12)" d="${off}"/><path fill="rgb(221 170 97 / 0.45)" d="${on}"/></g></svg>`;
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
};
