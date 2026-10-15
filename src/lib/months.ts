export function monthLabels(locale: string): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
  return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(Date.UTC(2026, i, 15))).replace('.', ''));
}

/** Season as "Start – End". Months are 1–12; the range starts after the largest circular gap. */
export function seasonRange(months: number[], locale: string): string {
  const labels = monthLabels(locale);
  const sorted = [...new Set(months)].sort((a, b) => a - b);
  if (sorted.length === 12) return `${labels[0]} – ${labels[11]}`;
  let gapAfter = sorted.length - 1;
  let best = -1;
  for (let i = 0; i < sorted.length; i++) {
    const next = sorted[(i + 1) % sorted.length] + (i === sorted.length - 1 ? 12 : 0);
    const gap = next - sorted[i];
    if (gap > best) { best = gap; gapAfter = i; }
  }
  const start = sorted[(gapAfter + 1) % sorted.length];
  const end = sorted[gapAfter];
  return start === end ? labels[start - 1] : `${labels[start - 1]} – ${labels[end - 1]}`;
}
