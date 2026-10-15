export type GrainKind = 'rice' | 'brokenRice' | 'groundnut' | 'arecanut' | 'turmeric' | 'ginger' | 'jaggery' | 'copra';
type Spec = { count: number; scale: [number, number, number]; color: string; jitter: number; shape: 'ellipsoid' | 'capsule' | 'box' | 'sphere' };

const SPECS: Record<GrainKind, Spec> = {
  rice: { count: 2200, scale: [0.11, 0.035, 0.035], color: '#F3EEDF', jitter: 0.04, shape: 'ellipsoid' },
  brokenRice: { count: 2400, scale: [0.06, 0.035, 0.035], color: '#EFE8D6', jitter: 0.05, shape: 'ellipsoid' },
  groundnut: { count: 900, scale: [0.12, 0.08, 0.08], color: '#D9A97A', jitter: 0.08, shape: 'ellipsoid' },
  arecanut: { count: 260, scale: [0.2, 0.17, 0.2], color: '#8A5A36', jitter: 0.12, shape: 'sphere' },
  turmeric: { count: 320, scale: [0.32, 0.06, 0.06], color: '#C9822A', jitter: 0.12, shape: 'capsule' },
  ginger: { count: 140, scale: [0.42, 0.13, 0.16], color: '#C8A57A', jitter: 0.15, shape: 'capsule' },
  jaggery: { count: 90, scale: [0.3, 0.22, 0.3], color: '#7A4A1E', jitter: 0.1, shape: 'box' },
  copra: { count: 160, scale: [0.3, 0.07, 0.24], color: '#F1EADB', jitter: 0.1, shape: 'ellipsoid' },
};

export function grainSpec(kind: GrainKind): Spec {
  return SPECS[kind];
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Instances as (x, y, z, rotY) forming a cone-shaped pile. */
export function scatterPile(count: number, seed: number, radius = 1.5): Float32Array {
  const rand = mulberry32(seed);
  const out = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const r = radius * Math.sqrt(rand());
    const a = rand() * Math.PI * 2;
    const height = (1 - r / radius) * radius * 0.7;
    out[i * 4] = Math.cos(a) * r;
    out[i * 4 + 1] = Math.max(0, height * rand() ** 0.5);
    out[i * 4 + 2] = Math.sin(a) * r;
    out[i * 4 + 3] = rand() * Math.PI * 2;
  }
  return out;
}
