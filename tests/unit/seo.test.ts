import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';
import { productTextSchema } from '../../src/lib/schemas';

// Search snippet budgets. Titles: ≤ 60 characters with the " | GoodBiz Agri" suffix.
// Descriptions: 140–160 characters; Chinese is denser, so 50–110 characters.
const locales = ['en', 'ar', 'fr', 'es', 'pt', 'ru', 'zh', 'id', 'de'];
const len = (s: string) => [...s].length;
const full = (t: string) => (t.includes('GoodBiz') ? t : `${t} | GoodBiz Agri`);
const range = (l: string) => (l === 'zh' ? [50, 110] : [140, 160]);
const pages = ['home', 'products', 'about', 'contact', 'blog'];

describe('page meta (ui strings)', () => {
  for (const l of locales) {
    const ui = JSON.parse(readFileSync(`src/i18n/ui/${l}.json`, 'utf8'));
    it(`${l} titles, descriptions and keywords fit`, () => {
      const [lo, hi] = range(l);
      for (const p of pages) {
        expect(len(full(ui[`meta.${p}Title`])), `${l} ${p} title`).toBeLessThanOrEqual(60);
        const d = len(ui[`meta.${p}Description`]);
        expect(d, `${l} ${p} description`).toBeGreaterThanOrEqual(lo);
        expect(d, `${l} ${p} description`).toBeLessThanOrEqual(hi);
        expect(ui[`meta.${p}Keywords`].split(',').length, `${l} ${p} keywords`).toBeGreaterThanOrEqual(4);
      }
    });
  }
});

describe('product meta (content)', () => {
  const slugs = readdirSync('src/content/products-i18n/en').map((f) => f.replace('.yaml', ''));
  for (const l of locales) {
    it(`${l} product titles are unique and fit, descriptions fit`, () => {
      const [lo, hi] = range(l);
      const titles = new Set<string>();
      for (const s of slugs) {
        const text = productTextSchema.parse(parse(readFileSync(`src/content/products-i18n/${l}/${s}.yaml`, 'utf8')));
        expect(len(full(text.seo.title)), `${l}/${s} title`).toBeLessThanOrEqual(60);
        expect(len(text.seo.description), `${l}/${s} description`).toBeGreaterThanOrEqual(lo);
        expect(len(text.seo.description), `${l}/${s} description`).toBeLessThanOrEqual(hi);
        // Direct answer for answer engines: the summary names the company as the exporter.
        expect(text.summary, `${l}/${s} summary`).toMatch(/GoodBiz Agri/);
        titles.add(text.seo.title);
      }
      expect(titles.size).toBe(slugs.length);
    });
  }
});
