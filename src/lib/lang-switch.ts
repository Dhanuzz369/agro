import { gtToCore, isLocale, type Locale } from '../i18n/config';
import { localizePath, stripLocale } from '../i18n/paths';

export function resolveTarget(gtCode: string, pathname: string, available: readonly Locale[]) {
  const core = gtToCore[gtCode];
  const { path } = stripLocale(pathname);
  if (core && available.includes(core)) return { type: 'core' as const, href: localizePath(path, core) };
  return { type: 'machine' as const, gtCode };
}

export function suggestLocale(navLangs: readonly string[], current: Locale, available: readonly Locale[]): Locale | null {
  for (const tag of navLangs) {
    const primary = tag.toLowerCase().split('-')[0];
    if (!isLocale(primary) || !available.includes(primary)) continue;
    return primary === current ? null : primary;
  }
  return null;
}

export const safeStorage = {
  get(key: string): string | null {
    try { return globalThis.localStorage?.getItem(key) ?? null; } catch { return null; }
  },
  set(key: string, value: string): void {
    try { globalThis.localStorage?.setItem(key, value); } catch { /* storage blocked */ }
  },
};

export function machineFallbackUrl(gtCode: string, pageUrl: string): string {
  return `https://translate.google.com/translate?sl=auto&tl=${encodeURIComponent(gtCode)}&u=${encodeURIComponent(pageUrl)}`;
}

export function googTransCookie(gtCode: string): string {
  return `googtrans=/en/${gtCode}; path=/; SameSite=Lax`;
}
