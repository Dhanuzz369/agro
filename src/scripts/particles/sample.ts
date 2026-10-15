function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sampleImage(
  img: { data: Uint8ClampedArray; width: number; height: number },
  count: number,
  opts: { alphaMin?: number; seed?: number; spread?: number } = {},
) {
  const { alphaMin = 128, seed = 1, spread = 6 } = opts;
  const { data, width, height } = img;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const opaque: number[] = [];
  for (let i = 0; i < width * height; i++) if (data[i * 4 + 3] >= alphaMin) opaque.push(i);
  if (!opaque.length) return { positions, colors };

  const rand = mulberry32(seed);
  const scale = spread / Math.max(width, height);
  for (let p = 0; p < count; p++) {
    const idx = opaque[Math.floor(rand() * opaque.length)];
    const x = idx % width;
    const y = Math.floor(idx / width);
    positions[p * 3] = (x - width / 2) * scale + (rand() - 0.5) * scale;
    positions[p * 3 + 1] = (height / 2 - y) * scale + (rand() - 0.5) * scale;
    positions[p * 3 + 2] = (rand() - 0.5) * 0.3;
    colors[p * 3] = data[idx * 4] / 255;
    colors[p * 3 + 1] = data[idx * 4 + 1] / 255;
    colors[p * 3 + 2] = data[idx * 4 + 2] / 255;
  }
  return { positions, colors };
}
