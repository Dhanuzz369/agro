import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';

const locales = ['en', 'ar', 'fr', 'es', 'pt', 'ru', 'zh', 'id', 'de'];
// A build timestamp on every URL tells crawlers nothing, so only blog posts carry a lastmod: their own date.
const postDates = Object.fromEntries(readdirSync('src/content/blog/en').map((f) => [
  f.replace(/\.mdx?$/, ''),
  readFileSync(`src/content/blog/en/${f}`, 'utf8').match(/^date:\s*(\S+)/m)?.[1],
]));

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://goodbizagro.com',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [
    mdx(),
    sitemap({
      i18n: { defaultLocale: 'en', locales: Object.fromEntries(locales.map((l) => [l, l === 'zh' ? 'zh-Hans' : l])) },
      serialize(item) {
        const date = postDates[item.url.match(/\/blog\/([^/]+)$/)?.[1]];
        if (date) item.lastmod = new Date(date).toISOString();
        // Match the x-default the page head declares (the English URL)
        const en = item.links?.find((l) => l.lang === 'en');
        if (en) item.links = [...item.links.filter((l) => l.lang !== 'x-default'), { lang: 'x-default', url: en.url }];
        return item;
      },
      filter: (page) => !page.includes('/og/') && !page.includes('/spec-sheets/') && !/\/thanks\/?$/.test(page) && !/\/404\/?$/.test(page),
    }),
  ],
  image: { responsiveStyles: true },
  vite: { build: { assetsInlineLimit: 2048 } },
});
