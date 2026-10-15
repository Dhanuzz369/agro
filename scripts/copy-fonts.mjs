import { cpSync, mkdirSync, existsSync, rmSync } from 'node:fs';
// Chinese pages load Noto Sans SC 400 only (one weight keeps /zh LCP inside budget).
const src = 'node_modules/@fontsource/noto-sans-sc';
const dest = 'public/fonts/sc';
if (existsSync(src)) {
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  cpSync(`${src}/400.css`, `${dest}/400.css`);
  cpSync(`${src}/files`, `${dest}/files`, { recursive: true, filter: (f) => !/\.woff2?$/.test(f) || /-400-normal\.woff2?$/.test(f) });
}
