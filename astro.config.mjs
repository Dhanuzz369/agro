import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';

const locales = ['en', 'ar', 'fr', 'es', 'pt', 'ru', 'zh', 'id', 'de'];
// A build timestamp on every URL tells crawlers nothing, so lastmod is a real content date: a blog post's own
// date, or the `updated` date in a product's data file (the date its specs or packing last changed).
const postDates = Object.fromEntries(readdirSync('src/content/blog/en').map((f) => [
  f.replace(/\.mdx?$/, ''),
  readFileSync(`src/content/blog/en/${f}`, 'utf8').match(/^date:\s*(\S+)/m)?.[1],
]));
const productDates = Object.fromEntries(readdirSync('src/content/products').map((f) => [
  f.replace(/\.ya?ml$/, ''),
  readFileSync(`src/content/products/${f}`, 'utf8').match(/^updated:\s*(\S+)/m)?.[1],
]));
// Product photos go into the sitemap so Google Images can find every variety. The sitemap is written after the
// pages, so the built page already names its optimised image files.
const productImages = (url) => {
  const path = new URL(url).pathname;
  // English URLs only: the translated pages show the same photos, and listing them once is enough.
  if (!/^\/products\/[^/]+$/.test(path)) return undefined;
  let html;
  try { html = readFileSync(`dist${path}/index.html`, 'utf8'); } catch { return undefined; }
  const srcs = [...html.matchAll(/<img[^>]*?\ssrc="(\/_astro\/[^"]+)"/g)].map((m) => new URL(m[1], url).href);
  return [...new Set(srcs)].map((src) => ({ url: src }));
};
// Links and images written in blog posts get a title from their own text or alt, like the rest of the site.
const textOf = (n) => (n.type === 'text' ? n.value : (n.children ?? []).map(textOf).join(''));
const rehypeTitles = () => (tree) => {
  const walk = (n) => {
    if (n.type === 'element' && !n.properties.title) {
      if (n.tagName === 'a') n.properties.title = textOf(n).trim() || undefined;
      if (n.tagName === 'img' && n.properties.alt) n.properties.title = n.properties.alt;
    }
    (n.children ?? []).forEach(walk);
  };
  walk(tree);
};
const inSection = (section) => (item) => (new RegExp(`^/(?:[a-z]{2}/)?${section}(/|$)`).test(new URL(item.url).pathname) ? item : undefined);

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://goodbizagro.com',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'directory', inlineStylesheets: 'always' },
  markdown: { rehypePlugins: [rehypeTitles] },
  integrations: [
    mdx(),
    sitemap({
      i18n: { defaultLocale: 'en', locales: Object.fromEntries(locales.map((l) => [l, l === 'zh' ? 'zh-Hans' : l])) },
      serialize(item) {
        const date = postDates[item.url.match(/\/blog\/([^/]+)$/)?.[1]] ?? productDates[item.url.match(/\/products\/([^/]+)$/)?.[1]];
        if (date) item.lastmod = new Date(date).toISOString();
        // Match the x-default the page head declares (the English URL)
        const en = item.links?.find((l) => l.lang === 'en');
        if (en) item.links = [...item.links.filter((l) => l.lang !== 'x-default'), { lang: 'x-default', url: en.url }];
        // English-only pages (blog posts not yet translated) still name themselves, as their page head does
        else if (!item.links?.length && !/^\/[a-z]{2}(\/|$)/.test(new URL(item.url).pathname)) item.links = [{ lang: 'en', url: item.url }, { lang: 'x-default', url: item.url }];
        const img = productImages(item.url);
        if (img?.length) item.img = img;
        return item;
      },
      // sitemap-products.xml, sitemap-blog.xml, and sitemap-pages.xml for the rest, all listed in sitemap-index.xml
      chunks: { products: inSection('products'), blog: inSection('blog') },
      filter: (page) => !page.includes('/og/') && !page.includes('/spec-sheets/') && !/\/thanks\/?$/.test(page) && !/\/404\/?$/.test(page),
    }),
  ],
  image: { responsiveStyles: true },
  vite: { build: { assetsInlineLimit: 2048 } },
});
