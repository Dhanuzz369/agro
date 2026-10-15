export const locales = ['en', 'ar', 'fr', 'es', 'pt', 'ru', 'zh', 'id', 'de'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
export const nonDefaultLocales = locales.filter((l) => l !== defaultLocale) as Locale[];

export function isLocale(x: string): x is Locale {
  return (locales as readonly string[]).includes(x);
}
export function isRtl(l: Locale): boolean {
  return l === 'ar';
}

export const localeLabels: Record<Locale, string> = {
  en: 'English', ar: 'العربية', fr: 'Français', es: 'Español', pt: 'Português',
  ru: 'Русский', zh: '简体中文', id: 'Bahasa Indonesia', de: 'Deutsch',
};

export const htmlLang: Record<Locale, string> = {
  en: 'en', ar: 'ar', fr: 'fr', es: 'es', pt: 'pt', ru: 'ru', zh: 'zh-Hans', id: 'id', de: 'de',
};

/** Open Graph locale (language_TERRITORY) per core locale. */
export const ogLocale: Record<Locale, string> = {
  en: 'en_US', ar: 'ar_AR', fr: 'fr_FR', es: 'es_ES', pt: 'pt_BR', ru: 'ru_RU', zh: 'zh_CN', id: 'id_ID', de: 'de_DE',
};

/** Google Translate language codes that correspond to a core locale. */
export const gtToCore: Record<string, Locale> = {
  en: 'en', ar: 'ar', fr: 'fr', es: 'es', pt: 'pt', ru: 'ru', 'zh-CN': 'zh', id: 'id', de: 'de',
};

/** Flag/short code shown on the floating pill. */
export const pillCode: Record<Locale, string> = {
  en: 'EN', ar: 'AR', fr: 'FR', es: 'ES', pt: 'PT', ru: 'RU', zh: '中文', id: 'ID', de: 'DE',
};
