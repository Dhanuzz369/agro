import { geoEqualEarth, geoMercator, geoPath, geoInterpolate } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import world110 from 'world-atlas/countries-110m.json' with { type: 'json' };
import world50 from 'world-atlas/countries-50m.json' with { type: 'json' };

type FC = GeoJSON.FeatureCollection<GeoJSON.Geometry, { name: string }>;
const countries110 = feature(world110 as unknown as Topology, (world110 as any).objects.countries as GeometryCollection) as unknown as FC;
const countries50 = feature(world50 as unknown as Topology, (world50 as any).objects.countries as GeometryCollection) as unknown as FC;

function worldProjection(width: number, height: number) {
  return geoEqualEarth().fitExtent([[8, 8], [width - 8, height - 8]], { type: 'Sphere' } as any);
}

export function projectWorld(width: number, height: number, lonlat: [number, number]): [number, number] {
  return worldProjection(width, height)(lonlat) as [number, number];
}

export function worldPaths(width: number, height: number, highlight: Set<string>) {
  const path = geoPath(worldProjection(width, height));
  return countries110.features
    .filter((f) => f.id !== '010') // drop Antarctica
    .map((f) => ({ id: String(f.id), d: path(f) ?? '', served: highlight.has(String(f.id)) }))
    .filter((p) => p.d);
}

export function worldArcs(width: number, height: number, from: [number, number], to: [number, number][]) {
  const path = geoPath(worldProjection(width, height));
  return to.map((dest) => {
    const interp = geoInterpolate(from, dest);
    const coords = Array.from({ length: 48 }, (_, i) => interp(i / 47));
    return path({ type: 'LineString', coordinates: coords }) ?? '';
  });
}

function southProjection(width: number, height: number) {
  const frame: GeoJSON.MultiPoint = { type: 'MultiPoint', coordinates: [[72.5, 7.8], [84.5, 7.8], [84.5, 18.5], [72.5, 18.5]] };
  return geoMercator().fitExtent([[16, 16], [width - 16, height - 16]], frame);
}

export function projectSouth(width: number, height: number, lonlat: [number, number]): [number, number] {
  return southProjection(width, height)(lonlat) as [number, number];
}

export function southIndiaOutline(width: number, height: number): string {
  const india = countries50.features.find((f) => f.id === '356')!;
  const lanka = countries50.features.find((f) => f.id === '144')!;
  const path = geoPath(southProjection(width, height));
  return `${path(india) ?? ''}${path(lanka) ?? ''}`;
}
