import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

const locales = ['en', 'ar', 'fr', 'es', 'pt', 'ru', 'zh', 'id', 'de'];

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://goodbizagri.com',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [
    mdx(),
    sitemap({
      i18n: { defaultLocale: 'en', locales: Object.fromEntries(locales.map((l) => [l, l])) },
      filter: (page) => !page.includes('/og/') && !page.includes('/spec-sheets/') && !page.endsWith('/thanks/'),
    }),
  ],
  image: { responsiveStyles: true },
  vite: { build: { assetsInlineLimit: 2048 } },
});
