import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const locales = ['en', 'ar', 'fr', 'es', 'pt', 'ru', 'zh', 'id', 'de'];
const out = { 'Placeholders (REPLACE:)': [], 'Missing translations': [], 'Pending review': [], 'Draft posts': [] };

const walk = (obj, path = '') =>
  Object.entries(obj).flatMap(([k, v]) => (v && typeof v === 'object' ? walk(v, `${path}${k}.`) : typeof v === 'string' && v.startsWith('REPLACE:') ? [`${path}${k}`] : []));
out['Placeholders (REPLACE:)'] = walk(parse(readFileSync('src/content/site.yaml', 'utf8')));

const en = JSON.parse(readFileSync('src/i18n/ui/en.json', 'utf8'));
for (const l of locales.slice(1)) {
  const file = `src/i18n/ui/${l}.json`;
  const table = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  const missing = Object.keys(en).filter((k) => !table[k]);
  if (missing.length) out['Missing translations'].push(`ui/${l}: ${missing.length} keys`);
  for (const dir of ['products-i18n']) {
    for (const f of readdirSync(`src/content/${dir}/en`)) {
      const path = `src/content/${dir}/${l}/${f}`;
      if (!existsSync(path)) { out['Missing translations'].push(`${dir}/${l}/${f}`); continue; }
      if (parse(readFileSync(path, 'utf8')).reviewStatus === 'pending') out['Pending review'].push(`${dir}/${l}/${f}`);
    }
  }
}

for (const l of locales) {
  const dir = `src/content/blog/${l}`;
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) if (/^draft:\s*true\s*$/m.test(readFileSync(join(dir, f), 'utf8').split(/^---\s*$/m)[1] ?? '')) out['Draft posts'].push(`${l}/${f}`);
}

for (const [title, items] of Object.entries(out)) {
  console.log(`\n${title} (${items.length})`);
  const shown = title === 'Pending review' ? items.slice(0, 10) : items;
  for (const i of shown) console.log(`  - ${i}`);
  if (shown.length < items.length) console.log(`  … and ${items.length - shown.length} more`);
}
