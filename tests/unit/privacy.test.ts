import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { locales } from '../../src/i18n/config';

const load = (l: string) => {
  const src = readFileSync(`src/content/legal/${l}/privacy.md`, 'utf8');
  const [, fm, body] = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)!;
  return { data: parse(fm), body };
};

describe('privacy policy', () => {
  const en = load('en');

  it('exists in every language with the same date and the same sections', () => {
    const sections = en.body.match(/^## /gm)!.length;
    expect(sections).toBeGreaterThanOrEqual(9);
    for (const l of locales) {
      const p = load(l);
      expect(String(p.data.updated), l).toBe(String(en.data.updated));
      expect(p.body.match(/^## /gm)?.length, l).toBe(sections);
      expect(p.data.description.length, l).toBeLessThanOrEqual(160);
    }
  });

  it('names the contact, every service and every cookie or storage key the site uses', () => {
    for (const l of locales) {
      const { body } = load(l);
      for (const s of ['agro@goodbizglobal.com', 'Google Analytics', 'Google Apps Script', 'Vercel', 'Google Translate', 'WhatsApp',
        '_ga', 'googtrans', 'gb.consent', 'gb.lang', 'gb.suggest.dismissed']) expect(body, `${l}: ${s}`).toContain(s);
    }
  });

  it('makes no claims the site cannot back', () => {
    for (const l of locales) {
      const { body } = load(l);
      expect(body, l).not.toMatch(/REPLACE:|Data Protection Officer|ISO 27001|SOC 2/i);
    }
  });
});
