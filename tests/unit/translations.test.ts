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
        expect(readFileSync(`src/content/products-i18n/${l}/${f}`, 'utf8'), `${l}/${f}`).not.toMatch(/HSN|\b(0910|1006|1701|0802|0801|1202)\d*\b/);
      }
    }
  });
});
