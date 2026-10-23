import { geoEqualEarth, geoPath, geoInterpolate } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import world110 from 'world-atlas/countries-110m.json' with { type: 'json' };

type FC = GeoJSON.FeatureCollection<GeoJSON.Geometry, { name: string }>;
const countries110 = feature(world110 as unknown as Topology, (world110 as any).objects.countries as GeometryCollection) as unknown as FC;

function worldProjection(width: number, height: number) {
  return geoEqualEarth().fitExtent([[8, 8], [width - 8, height - 8]], { type: 'Sphere' } as any);
}

export function projectWorld(width: number, height: number, lonlat: [number, number]): [number, number] {
  return worldProjection(width, height)(lonlat) as [number, number];
}

// Coordinates are inlined into the HTML, so keep them short: whole units for the 110m country
// shapes (1000-unit viewBox, coarser than the atlas itself), 0.1 for arcs.
const DIGITS = 1;

export function worldPaths(width: number, height: number, highlight: Set<string>) {
  const path = geoPath(worldProjection(width, height)).digits(0);
  return countries110.features
    .filter((f) => f.id !== '010') // drop Antarctica
    .map((f) => ({ id: String(f.id), d: path(f) ?? '', served: highlight.has(String(f.id)) }))
    .filter((p) => p.d);
}

export function worldArcs(width: number, height: number, from: [number, number], to: [number, number][]) {
  const path = geoPath(worldProjection(width, height)).digits(DIGITS);
  return to.map((dest) => {
    const interp = geoInterpolate(from, dest);
    const coords = Array.from({ length: 48 }, (_, i) => interp(i / 47));
    return path({ type: 'LineString', coordinates: coords }) ?? '';
  });
}
