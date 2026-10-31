import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { parse } from 'yaml';
import { z } from 'astro/zod';
import { productSchema, siteSchema, productTextSchema } from '../../src/lib/schemas';
import { placeLabel } from '../../src/data/places';

const dir = 'src/content/products';
const slugs = ['rice', 'non-basmati-rice', 'broken-rice', 'jaggery', 'arecanut', 'groundnuts', 'coconut-copra', 'ginger', 'turmeric'];
const imageStub = () => z.string();

describe('products', () => {
  it('has exactly the 9 product files', () => {
    expect(readdirSync(dir).map((f) => f.replace('.yaml', '')).sort()).toEqual([...slugs].sort());
  });
  for (const slug of slugs) {
    it(`${slug} matches schema and images exist`, () => {
      const file = join(dir, `${slug}.yaml`);
      const raw = parse(readFileSync(file, 'utf8'));
      const data = productSchema(imageStub).parse(raw);
      const imgs = [data.heroImage.src, ...data.varieties.map((v) => v.image.src)];
      for (const img of imgs) expect(existsSync(resolve(dirname(file), img)), img).toBe(true);
    });
  }
  it('covers the 14 HSN lines exactly once across varieties or products', () => {
    const all = slugs.flatMap((s) => productSchema(imageStub).parse(parse(readFileSync(join(dir, `${s}.yaml`), 'utf8'))).hsn.map((h) => h.code));
    expect(all.sort()).toEqual(['09101110','09101120','09101130','09101190','09103010','09103020','09103030','100640','1006','10063099','120242','1701','80280','8011220'].sort());
  });
  it('marks arecanut, groundnut and coconut codes unverified', () => {
    for (const s of ['arecanut', 'groundnuts', 'coconut-copra']) {
      const d = productSchema(imageStub).parse(parse(readFileSync(join(dir, `${s}.yaml`), 'utf8')));
      expect(d.hsn.every((h) => h.verified === false)).toBe(true);
    }
  });
  it('no product declares loading ports', () => {
    for (const f of readdirSync(dir)) expect(parse(readFileSync(join(dir, f), 'utf8')).ports, f).toBeUndefined();
  });
  it('accepts a variety with no region or market', () => {
    const raw = parse(readFileSync(join(dir, 'turmeric.yaml'), 'utf8'));
    delete raw.varieties[0].region; delete raw.varieties[0].market; raw.markets = [];
    expect(() => productSchema(imageStub).parse(raw)).not.toThrow();
  });
  it('labels states by name and districts with their state', () => {
    expect(placeLabel('kerala')).toBe('Kerala');
    expect(placeLabel('erode')).toBe('Erode, Tamil Nadu');
  });
  it('rejects a malformed HSN code', () => {
    const raw = parse(readFileSync(join(dir, 'rice.yaml'), 'utf8'));
    raw.hsn[0].code = '1006 30';
    expect(() => productSchema(imageStub).parse(raw)).toThrow();
  });
  it('rejects a variety HSN not listed on the product', () => {
    const raw = parse(readFileSync(join(dir, 'turmeric.yaml'), 'utf8'));
    raw.varieties[0].hsn = '1006';
    expect(() => productSchema(imageStub).parse(raw)).toThrow();
  });
});

describe('site', () => {
  it('matches schema', () => {
    expect(() => siteSchema.parse(parse(readFileSync('src/content/site.yaml', 'utf8')))).not.toThrow();
  });
});

describe('english text', () => {
  for (const slug of slugs) {
    it(`products-i18n/en/${slug} names every variety`, () => {
      const text = productTextSchema.parse(parse(readFileSync(`src/content/products-i18n/en/${slug}.yaml`, 'utf8')));
      const data = productSchema(imageStub).parse(parse(readFileSync(join(dir, `${slug}.yaml`), 'utf8')));
      expect(Object.keys(text.varieties).sort()).toEqual(data.varieties.map((v) => v.id).sort());
    });
  }
});
