// src/i18n/home-faq.ts
import { createT, type UiKey } from './t';
import type { Locale } from './config';
export function homeFaq(locale: Locale) {
  const t = createT(locale);
  return [1, 2, 3, 4, 5, 6].map((n) => ({ q: t(`home.faq.q${n}` as UiKey), a: t(`home.faq.a${n}` as UiKey) }));
}
