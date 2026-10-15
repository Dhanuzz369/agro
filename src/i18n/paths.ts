import { locales, defaultLocale, isLocale, htmlLang, type Locale } from './config';

function clean(path: string): string {
  if (!path.startsWith('/')) path = `/${path}`;
  return path.length > 1 ? path.replace(/\/+$/, '') : '/';
}

export function localizePath(path: string, locale: Locale): string {
  const p = clean(path);
  if (locale === defaultLocale) return p;
  return p === '/' ? `/${locale}` : `/${locale}${p}`;
}

export function stripLocale(pathname: string): { locale: Locale; path: string } {
  const p = clean(pathname);
  const [, first, ...rest] = p.split('/');
  if (first && isLocale(first) && first !== defaultLocale) {
    return { locale: first, path: rest.length ? `/${rest.join('/')}` : '/' };
  }
  return { locale: defaultLocale, path: p };
}

export function alternates(path: string, available: readonly Locale[] = locales) {
  const list = available.map((l) => ({ hreflang: htmlLang[l], path: localizePath(path, l) }));
  const fallback = available.includes(defaultLocale) ? defaultLocale : available[0];
  return [...list, { hreflang: 'x-default', path: localizePath(path, fallback) }];
}
