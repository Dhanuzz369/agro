import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { postsFor } from '../lib/blog';
import { createT } from '../i18n/t';
import { localizePath } from '../i18n/paths';
import type { Locale } from '../i18n/config';

export async function feed(locale: Locale, context: APIContext) {
  const t = createT(locale);
  const posts = (await postsFor(locale)).filter((p) => !p.fallback);
  return rss({
    title: `GoodBiz Agri — ${t('meta.blogTitle')}`,
    description: t('meta.blogDescription'),
    site: context.site!,
    items: posts.map((p) => ({ title: p.entry.data.title, description: p.entry.data.description, pubDate: p.entry.data.date, link: localizePath(`/blog/${p.slug}`, locale) })),
    customData: `<language>${locale}</language>`,
  });
}

export const GET = (context: APIContext) => feed('en', context);
