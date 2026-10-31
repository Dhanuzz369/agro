import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';
import { productTextSchema } from '../../src/lib/schemas';

const en = JSON.parse(readFileSync('src/i18n/ui/en.json', 'utf8'));
const others = ['ar', 'fr', 'es', 'pt', 'ru', 'zh', 'id', 'de'];
const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();

describe('ui translations', () => {
  for (const l of others) {
    const table = JSON.parse(readFileSync(`src/i18n/ui/${l}.json`, 'utf8'));
    it(`${l} has every key`, () => expect(Object.keys(table).sort()).toEqual(Object.keys(en).sort()));
    it(`${l} keeps placeholders`, () => {
      for (const k of Object.keys(en)) expect(placeholders(table[k]), k).toEqual(placeholders(en[k]));
    });
    it(`${l} has no empty strings`, () => {
      for (const [k, v] of Object.entries(table)) expect(String(v).trim().length, k).toBeGreaterThan(0);
    });
  }
});

describe('content translations', () => {
  const products = readdirSync('src/content/products-i18n/en');
  for (const l of others) {
    it(`${l} has all product files and the same variety keys`, () => {
      for (const f of products) {
        const enText = productTextSchema.parse(parse(readFileSync(`src/content/products-i18n/en/${f}`, 'utf8')));
        const text = productTextSchema.parse(parse(readFileSync(`src/content/products-i18n/${l}/${f}`, 'utf8')));
        expect(Object.keys(text.varieties).sort(), f).toEqual(Object.keys(enText.varieties).sort());
      }
    });
    it(`${l} keeps the same number of FAQ items as English`, () => {
      for (const f of products) {
        const enText = productTextSchema.parse(parse(readFileSync(`src/content/products-i18n/en/${f}`, 'utf8')));
        const text = productTextSchema.parse(parse(readFileSync(`src/content/products-i18n/${l}/${f}`, 'utf8')));
        expect(text.faq.length, `${l}/${f}`).toBe(enText.faq.length);
      }
    });
  }
});

describe('no HSN codes in visitor-facing text', () => {
  const locales = ['en', ...others];
  it('ui strings never mention HSN', () => {
    for (const l of locales) expect(readFileSync(`src/i18n/ui/${l}.json`, 'utf8'), l).not.toMatch(/HSN/);
  });
  it('product text never mentions HSN or a tariff code', () => {
    for (const l of locales) {
      for (const f of readdirSync(`src/content/products-i18n/${l}`)) {
        expect(readFileSync(`src/content/products-i18n/${l}/${f}`, 'utf8'), `${l}/${f}`).not.toMatch(/HSN|\b(0910|1006|1701|0802|0801|1202|5305)\d*\b/);
      }
    }
  });
});

describe('product data dictionaries', async () => {
  const { dataDictionaries } = await import('../../src/i18n/data');
  const { readdirSync, readFileSync } = await import('node:fs');
  const { parse } = await import('yaml');
  // Every English phrase in the product files that contains words, so a new phrase can't ship untranslated.
  const phrases = new Set<string>();
  for (const f of readdirSync('src/content/products')) {
    const d = parse(readFileSync(`src/content/products/${f}`, 'utf8'));
    [d.shelfLife, ...d.packing, d.containerLoad.ft20, d.containerLoad.ft40].forEach((s: string) => phrases.add(s));
    for (const v of d.varieties) [...(v.packing ?? []), ...v.specs.map((s: { value: string }) => s.value)].forEach((s: string) => phrases.add(s));
  }
  const worded = [...phrases].filter((s) => /[A-Za-z]{3,}/.test(s));
  for (const [locale, dict] of Object.entries(dataDictionaries)) {
    it(`${locale} translates every worded product phrase`, () => {
      expect(worded.filter((s) => !dict[s])).toEqual([]);
    });
  }
});

describe('no loading ports named in visitor text', () => {
  // Kochi stays allowed as a sourcing place (ginger's spice trade), so English matches it only in port phrases.
  const portNames: Record<string, RegExp> = {
    en: /Chennai|Tuticorin|Mangalore|Kochi Port|Cochin Port|ports? (?:of|at) Kochi/i,
    ar: /تشيناي|توتيكورين|مانغالور|مانجالور|مانغلور/, fr: /Chennai|Tuticorin|Mangalore/i, es: /Chennai|Tuticor[ií]n|Mangalore/i,
    pt: /Chennai|Tuticorin|Mangalore/i, ru: /Ченна|Тутикорин|Мангалор/, zh: /金奈|图蒂科林|杜蒂戈林|门格洛尔|芒格洛尔/,
    id: /Chennai|Tuticorin|Mangalore/i, de: /Chennai|Tuticorin|Mangalore/i,
  };
  it.each(Object.keys(portNames))('%s text names no loading port', (l) => {
    const files = [`src/i18n/ui/${l}.json`, ...readdirSync(`src/content/products-i18n/${l}`).map((f) => `src/content/products-i18n/${l}/${f}`)];
    for (const f of files) expect(readFileSync(f, 'utf8'), f).not.toMatch(portNames[l]);
  });
});

describe('fixes from the branch review', () => {
  const locales = ['en', 'ar', 'fr', 'es', 'pt', 'ru', 'zh', 'id', 'de'];
  it('sourcing stories never carry the shipping-port wording', () => {
    for (const l of locales) for (const f of readdirSync(`src/content/products-i18n/${l}`)) {
      const story = productTextSchema.parse(parse(readFileSync(`src/content/products-i18n/${l}/${f}`, 'utf8'))).sourcingStory;
      expect(story, `${l}/${f}`).not.toMatch(/port that suits|passenden indischen Hafen|porto indiano mais adequado|الميناء الهندي الأنسب|port indien adapté|puerto indio que|pelabuhan India yang sesuai|индийского порта|印度港口/);
    }
  });
  it('the home range heading does not state a product count', () => {
    for (const l of locales) {
      const t = JSON.parse(readFileSync(`src/i18n/ui/${l}.json`, 'utf8'))['home.range.title'];
      expect(t, l).not.toMatch(/Nine|Neun|Neuf|Nueve|Nove|Sembilan|Девять|九|تسع/);
    }
  });
});
