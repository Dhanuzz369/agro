import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

const locales = ['en', 'ar', 'fr', 'es', 'pt', 'ru', 'zh', 'id', 'de'];

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://goodbizagri.com',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [
    mdx(),
    sitemap({
      lastmod: new Date(),
      i18n: { defaultLocale: 'en', locales: Object.fromEntries(locales.map((l) => [l, l === 'zh' ? 'zh-Hans' : l])) },
      filter: (page) => !page.includes('/og/') && !page.includes('/spec-sheets/') && !/\/thanks\/?$/.test(page) && !/\/404\/?$/.test(page),
    }),
  ],
  image: { responsiveStyles: true },
  vite: { build: { assetsInlineLimit: 2048 } },
});
