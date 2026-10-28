import { describe, it, expect, vi, afterEach } from 'vitest';
import { resolveTarget, suggestLocale, safeStorage, machineFallbackUrl, googTransCookie } from '../../src/lib/lang-switch';
import { locales } from '../../src/i18n/config';

describe('resolveTarget', () => {
  it('core language navigates to localized path', () =>
    expect(resolveTarget('fr', '/products/turmeric', locales)).toEqual({ type: 'core', href: '/fr/products/turmeric' }));
  it('switching from a localized page keeps the path', () =>
    expect(resolveTarget('de', '/ar/products/rice', locales)).toEqual({ type: 'core', href: '/de/products/rice' }));
  it('zh-CN maps to core zh', () => expect(resolveTarget('zh-CN', '/', locales)).toEqual({ type: 'core', href: '/zh' }));
  it('English goes to unprefixed path', () => expect(resolveTarget('en', '/fr/about', locales)).toEqual({ type: 'core', href: '/about' }));
  it('non-core language uses machine translation', () => expect(resolveTarget('tr', '/about', locales)).toEqual({ type: 'machine', gtCode: 'tr' }));
  it('core language without that page version uses machine translation', () =>
    expect(resolveTarget('fr', '/blog/x', ['en'])).toEqual({ type: 'machine', gtCode: 'fr' }));
});

describe('suggestLocale', () => {
  it('suggests a matching core locale', () => expect(suggestLocale(['fr-FR', 'en'], 'en', locales)).toBe('fr'));
  it('maps zh-Hans-CN to zh', () => expect(suggestLocale(['zh-Hans-CN'], 'en', locales)).toBe('zh'));
  it('maps pt-BR to pt', () => expect(suggestLocale(['pt-BR'], 'en', locales)).toBe('pt'));
  it('returns null when browser language is the current one', () => expect(suggestLocale(['en-US', 'fr'], 'en', locales)).toBeNull());
  it('returns null for non-core languages', () => expect(suggestLocale(['tr-TR'], 'en', locales)).toBeNull());
  it('returns null when the page lacks that locale', () => expect(suggestLocale(['fr'], 'en', ['en'])).toBeNull());
});

describe('safeStorage', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('returns null and swallows errors when storage throws', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } });
    expect(safeStorage.get('x')).toBeNull();
    expect(() => safeStorage.set('x', '1')).not.toThrow();
  });
  it('returns null when storage is undefined', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(safeStorage.get('x')).toBeNull();
  });
});

describe('machine translation helpers', () => {
  it('builds fallback url', () =>
    expect(machineFallbackUrl('tr', 'https://goodbizagro.com/about')).toBe('https://translate.google.com/translate?sl=auto&tl=tr&u=https%3A%2F%2Fgoodbizagro.com%2Fabout'));
  it('builds googtrans cookie', () => expect(googTransCookie('tr')).toBe('googtrans=/en/tr; path=/; SameSite=Lax'));
  it('builds googtrans cookie with a custom source', () => expect(googTransCookie('tr', 'fr')).toBe('googtrans=/fr/tr; path=/; SameSite=Lax'));
});
