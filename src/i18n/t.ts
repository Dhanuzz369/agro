import en from './ui/en.json';
import type { Locale } from './config';

export type UiKey = keyof typeof en;
export type T = (key: UiKey, vars?: Record<string, string | number>) => string;

const files = import.meta.glob<{ default: Partial<Record<UiKey, string>> }>('./ui/*.json', { eager: true });
const dict: Record<string, Partial<Record<UiKey, string>>> = {};
for (const [path, mod] of Object.entries(files)) dict[path.match(/\/(\w+)\.json$/)![1]] = mod.default;

function interpolate(s: string, vars?: Record<string, string | number>) {
  return vars ? s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : s;
}

export function createT(locale: Locale): T {
  const table = dict[locale] ?? {};
  return (key, vars) => interpolate(table[key] ?? en[key], vars);
}

export function missingKeys(locale: Locale): UiKey[] {
  const table = dict[locale] ?? {};
  return (Object.keys(en) as UiKey[]).filter((k) => !table[k]);
}
