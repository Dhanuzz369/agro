export function readingTime(text: string): number {
  const cjk = (text.match(/[㐀-鿿]/g) ?? []).length;
  const words = text.replace(/[㐀-鿿]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220 + cjk / 400));
}
export const postSlug = (id: string) => id.split('/').slice(1).join('/');
/** Drafts (`draft: true`) are never built, listed, syndicated or put in the sitemap. */
export const isPublished = (p: { data: { draft?: boolean } }) => !p.data.draft;
export const postLocale = (id: string) => id.split('/')[0];

/** Posts whose front-matter `products` lists this product slug (input order kept). */
export const aboutProduct = <T extends { entry: { data: { products: string[] } } }>(posts: T[], slug: string): T[] =>
  posts.filter((p) => p.entry.data.products.includes(slug));
