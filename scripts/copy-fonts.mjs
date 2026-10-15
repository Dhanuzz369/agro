import { cpSync, mkdirSync, existsSync } from 'node:fs';
const src = 'node_modules/@fontsource/noto-sans-sc';
const dest = 'public/fonts/sc';
if (existsSync(src)) {
  mkdirSync(dest, { recursive: true });
  cpSync(`${src}/400.css`, `${dest}/400.css`);
  cpSync(`${src}/500.css`, `${dest}/500.css`);
  cpSync(`${src}/files`, `${dest}/files`, { recursive: true });
}
