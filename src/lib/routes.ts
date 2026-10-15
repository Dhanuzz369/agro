import { nonDefaultLocales } from '../i18n/config';
export function localeStaticPaths() {
  return nonDefaultLocales.map((lang) => ({ params: { lang } }));
}
