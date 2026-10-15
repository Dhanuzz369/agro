import { describe, it, expect } from 'vitest';
import { locales, isRtl, isLocale, gtToCore, ogLocale } from '../../src/i18n/config';
import { allLanguages, nativeName } from '../../src/i18n/languages';
import { localizePath, stripLocale, alternates } from '../../src/i18n/paths';

describe('config', () => {
  it('has 9 core locales with en first', () => {
    expect(locales).toEqual(['en', 'ar', 'fr', 'es', 'pt', 'ru', 'zh', 'id', 'de']);
  });
  it('marks only Arabic RTL', () => {
    expect(locales.filter(isRtl)).toEqual(['ar']);
  });
  it('maps Google Translate zh-CN to core zh', () => expect(gtToCore['zh-CN']).toBe('zh'));
  it('maps every locale to a valid og:locale', () => {
    expect(ogLocale).toEqual({ en: 'en_US', ar: 'ar_AR', fr: 'fr_FR', es: 'es_ES', pt: 'pt_BR', ru: 'ru_RU', zh: 'zh_CN', id: 'id_ID', de: 'de_DE' });
  });
  it('isLocale guards', () => { expect(isLocale('fr')).toBe(true); expect(isLocale('it')).toBe(false); });
});

describe('languages', () => {
  it('lists 104 unique languages including every core locale', () => {
    expect(allLanguages).toHaveLength(104);
    const codes = new Set(allLanguages.map((l) => l.code));
    expect(codes.size).toBe(104);
    for (const c of ['en', 'ar', 'fr', 'es', 'pt', 'ru', 'zh-CN', 'id', 'de']) expect(codes.has(c)).toBe(true);
  });
  it('resolves native names', () => {
    expect(nativeName('fr')).toBe('français');
    expect(nativeName('ar')).toBe('العربية');
    expect(nativeName('iw')).toBe('עברית');
    expect(nativeName('zz-unknown')).toBe('zz-unknown');
  });
});

describe('paths', () => {
  it('localizes', () => {
    expect(localizePath('/', 'en')).toBe('/');
    expect(localizePath('/', 'ar')).toBe('/ar');
    expect(localizePath('/products/turmeric', 'fr')).toBe('/fr/products/turmeric');
  });
  it('strips locale prefix', () => {
    expect(stripLocale('/fr/products/turmeric')).toEqual({ locale: 'fr', path: '/products/turmeric' });
    expect(stripLocale('/products/turmeric/')).toEqual({ locale: 'en', path: '/products/turmeric' });
    expect(stripLocale('/ar')).toEqual({ locale: 'ar', path: '/' });
    expect(stripLocale('/italy-guide')).toEqual({ locale: 'en', path: '/italy-guide' });
  });
  it('builds alternates with x-default', () => {
    const a = alternates('/about', ['en', 'fr']);
    expect(a).toEqual([
      { hreflang: 'en', path: '/about' },
      { hreflang: 'fr', path: '/fr/about' },
      { hreflang: 'x-default', path: '/about' },
    ]);
  });
  it('uses zh-Hans for Chinese hreflang', () => {
    expect(alternates('/', ['zh']).find((x) => x.path === '/zh')?.hreflang).toBe('zh-Hans');
  });
});
