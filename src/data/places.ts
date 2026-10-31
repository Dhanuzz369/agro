export const places = {
  bengaluru: { name: 'Bengaluru', state: 'Karnataka', lon: 77.59, lat: 12.97, kind: 'hq' },
  // Whole states, for products bought from several suppliers across a state rather than one market town
  karnataka: { name: 'Karnataka', state: 'Karnataka', lon: 76.17, lat: 14.52, kind: 'state' },
  tamilNadu: { name: 'Tamil Nadu', state: 'Tamil Nadu', lon: 78.66, lat: 11.13, kind: 'state' },
  kerala: { name: 'Kerala', state: 'Kerala', lon: 76.27, lat: 10.35, kind: 'state' },
  raichur: { name: 'Raichur', state: 'Karnataka', lon: 77.36, lat: 16.2, kind: 'district' },
  mandya: { name: 'Mandya', state: 'Karnataka', lon: 76.9, lat: 12.52, kind: 'district' },
  thanjavur: { name: 'Thanjavur', state: 'Tamil Nadu', lon: 79.14, lat: 10.79, kind: 'district' },
  palakkad: { name: 'Palakkad', state: 'Kerala', lon: 76.65, lat: 10.78, kind: 'district' },
  godavari: { name: 'Godavari Delta', state: 'Andhra Pradesh', lon: 81.8, lat: 16.9, kind: 'district' },
  nellore: { name: 'Nellore', state: 'Andhra Pradesh', lon: 79.99, lat: 14.44, kind: 'district' },
  belagavi: { name: 'Belagavi', state: 'Karnataka', lon: 74.5, lat: 15.85, kind: 'district' },
  thoothukudi: { name: 'Thoothukudi', state: 'Tamil Nadu', lon: 78.13, lat: 8.9, kind: 'district' },
  shivamogga: { name: 'Shivamogga', state: 'Karnataka', lon: 75.57, lat: 13.93, kind: 'district' },
  dakshinaKannada: { name: 'Dakshina Kannada', state: 'Karnataka', lon: 75.0, lat: 12.87, kind: 'district' },
  kasaragod: { name: 'Kasaragod', state: 'Kerala', lon: 75.0, lat: 12.5, kind: 'district' },
  chitradurga: { name: 'Chitradurga', state: 'Karnataka', lon: 76.4, lat: 14.23, kind: 'district' },
  anantapur: { name: 'Anantapur', state: 'Andhra Pradesh', lon: 77.6, lat: 14.68, kind: 'district' },
  tiruvannamalai: { name: 'Tiruvannamalai', state: 'Tamil Nadu', lon: 79.07, lat: 12.23, kind: 'district' },
  tiptur: { name: 'Tiptur', state: 'Karnataka', lon: 76.48, lat: 13.26, kind: 'district' },
  tumakuru: { name: 'Tumakuru', state: 'Karnataka', lon: 77.1, lat: 13.34, kind: 'district' },
  pollachi: { name: 'Pollachi', state: 'Tamil Nadu', lon: 77.0, lat: 10.66, kind: 'district' },
  wayanad: { name: 'Wayanad', state: 'Kerala', lon: 76.13, lat: 11.68, kind: 'district' },
  kodagu: { name: 'Kodagu', state: 'Karnataka', lon: 75.8, lat: 12.42, kind: 'district' },
  hassan: { name: 'Hassan', state: 'Karnataka', lon: 76.1, lat: 13.0, kind: 'district' },
  erode: { name: 'Erode', state: 'Tamil Nadu', lon: 77.72, lat: 11.34, kind: 'district' },
  salem: { name: 'Salem', state: 'Tamil Nadu', lon: 78.15, lat: 11.66, kind: 'district' },
  alleppey: { name: 'Alappuzha (Alleppey)', state: 'Kerala', lon: 76.33, lat: 9.49, kind: 'district' },
} as const satisfies Record<string, { name: string; state: string; lon: number; lat: number; kind: 'district' | 'state' | 'hq' }>;

export type PlaceId = keyof typeof places;
export const placeIds = Object.keys(places) as [PlaceId, ...PlaceId[]];

/** "Kerala" for a state, "Erode, Tamil Nadu" for a district or town. */
export const placeLabel = (id: PlaceId) => {
  const p: { name: string; state: string; kind: string } = places[id];
  return p.kind === 'state' ? p.name : `${p.name}, ${p.state}`;
};
