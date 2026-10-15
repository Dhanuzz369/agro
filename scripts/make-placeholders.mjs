// Generates plain tinted placeholder JPGs (no text: they are public until replaced) for every image
// referenced in product YAML. Run once; real photos replace these files later (same names).
import { readFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve, join, sep } from 'node:path';
import { parse } from 'yaml';
import sharp from 'sharp';

const dir = 'src/content/products';
const assets = resolve('src/assets') + sep;
// Image paths come from YAML: never write outside src/assets/ or anything but a .jpg.
const guard = (out) => {
  if (!out.startsWith(assets) || !out.toLowerCase().endsWith('.jpg')) throw new Error(`refusing to write ${out}: must be a .jpg under ${assets}`);
  return out;
};
const tints = ['#C9B48A', '#B9864A', '#8A4B2A', '#D99A1E', '#A7A27A', '#7F8C5A'];
let i = 0;
for (const f of readdirSync(dir)) {
  const file = join(dir, f);
  const p = parse(readFileSync(file, 'utf8'));
  const imgs = [p.heroImage.src, ...p.varieties.map((v) => v.image.src)];
  for (const rel of imgs) {
    const out = guard(resolve(dirname(file), rel));
    if (existsSync(out)) continue;
    mkdirSync(dirname(out), { recursive: true });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200"><rect width="100%" height="100%" fill="${tints[i++ % tints.length]}"/></svg>`;
    await sharp(Buffer.from(svg)).jpeg({ quality: 80 }).toFile(out);
  }
}
console.log('placeholders ready');
