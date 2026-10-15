export function mergeText<T>(base: T | undefined, localized: T | undefined): { text: T; fallback: boolean } {
  if (localized) return { text: localized, fallback: false };
  if (base) return { text: base, fallback: true };
  throw new Error('No text in either locale');
}
