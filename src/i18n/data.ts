import type { Locale } from './config';
import ar from './data/ar.json';
import de from './data/de.json';
import es from './data/es.json';
import fr from './data/fr.json';
import id from './data/id.json';
import pt from './data/pt.json';
import ru from './data/ru.json';
import zh from './data/zh.json';

// Product data (packing, shelf life, container loads, spec values) is written once in English in
// src/content/products; these dictionaries translate each phrase. A phrase missing here shows in English.
export const dataDictionaries: Record<Exclude<Locale, 'en'>, Record<string, string>> = { ar, de, es, fr, id, pt, ru, zh };

export function createTd(locale: Locale) {
  const dict = locale === 'en' ? undefined : dataDictionaries[locale];
  return (s: string) => dict?.[s] ?? s;
}
