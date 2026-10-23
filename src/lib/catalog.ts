import { getCollection, getEntry } from 'astro:content';
import type { Locale } from '../i18n/config';
import type { ProductData, ProductText, SiteData } from './schemas';
import { mergeText } from './catalog-pure';

export type LocalizedProduct = { slug: string; data: ProductData; text: ProductText; fallback: boolean };

export async function getLocalizedProducts(locale: Locale): Promise<LocalizedProduct[]> {
  const [products, texts] = await Promise.all([getCollection('products'), getCollection('productsI18n')]);
  const byId = new Map(texts.map((t) => [t.id, t.data]));
  return products
    .map((p) => {
      const { text, fallback } = mergeText(byId.get(`en/${p.id}`), byId.get(`${locale}/${p.id}`));
      return { slug: p.id, data: p.data as ProductData, text, fallback };
    })
    .sort((a, b) => a.data.order - b.data.order);
}

export async function getLocalizedProduct(locale: Locale, slug: string) {
  const all = await getLocalizedProducts(locale);
  const found = all.find((p) => p.slug === slug);
  if (!found) throw new Error(`Unknown product ${slug}`);
  return found;
}

export async function getSite(): Promise<SiteData> {
  const entry = await getEntry('site', 'site');
  if (!entry) throw new Error('site.yaml missing');
  return entry.data as SiteData;
}
