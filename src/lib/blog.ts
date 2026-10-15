import { getCollection, type CollectionEntry } from 'astro:content';
import { locales, type Locale } from '../i18n/config';
import { postSlug, postLocale, isPublished } from './blog-pure';

export type PostRef = { entry: CollectionEntry<'blog'>; slug: string; locale: string; fallback: boolean };

/** Every non-draft post. Use this instead of getCollection('blog'). */
export async function publishedPosts(): Promise<CollectionEntry<'blog'>[]> {
  return getCollection('blog', isPublished);
}

export async function postsFor(locale: Locale): Promise<PostRef[]> {
  const all = await publishedPosts();
  const local = all.filter((p) => postLocale(p.id) === locale);
  const localSlugs = new Set(local.map((p) => p.data.translationOf ?? postSlug(p.id)));
  const english = locale === 'en' ? [] : all.filter((p) => postLocale(p.id) === 'en' && !localSlugs.has(postSlug(p.id)));
  return [
    ...local.map((entry) => ({ entry, slug: postSlug(entry.id), locale, fallback: false })),
    ...english.map((entry) => ({ entry, slug: postSlug(entry.id), locale: 'en', fallback: true })),
  ].sort((a, b) => b.entry.data.date.getTime() - a.entry.data.date.getTime());
}

export async function postAvailability(slug: string): Promise<Locale[]> {
  const all = await publishedPosts();
  return locales.filter((l) => all.some((p) => postLocale(p.id) === l && postSlug(p.id) === slug));
}
