import type { SiteData } from './schemas';

const ctx = 'https://schema.org';
// Placeholder values ("REPLACE: …") must never reach structured data: they become undefined and JSON.stringify drops them.
const real = (v: string) => (v.trim().startsWith('REPLACE:') ? undefined : v);

export const languages = ['English', 'Arabic', 'French', 'Spanish', 'Portuguese', 'Russian', 'Chinese', 'Indonesian', 'German'];

/** "+91 88847 99369" → "+91-8884799369" (country code, hyphen, national number). */
export function e164Dashed(phone: string): string | undefined {
  const p = real(phone);
  if (!p) return undefined;
  const digits = p.replace(/\D/g, '');
  return digits.startsWith('91') && digits.length === 12 ? `+91-${digits.slice(2)}` : `+${digits}`;
}

export const orgId = (siteUrl: string) => `${new URL('/', siteUrl).href}#organization`;

// description: the page language's own summary, so a translated page doesn't carry an English Organization block.
export function organizationLd(site: SiteData, siteUrl: string, description?: string) {
  const url = new URL('/', siteUrl).href;
  const telephone = e164Dashed(site.phone);
  const email = real(site.email);
  return {
    '@context': ctx,
    '@type': 'Organization',
    '@id': orgId(siteUrl),
    name: site.name,
    legalName: real(site.legalName),
    url,
    logo: { '@type': 'ImageObject', url: new URL('/icon-512.png', siteUrl).href, width: 512, height: 512 },
    image: new URL('/og/home.png', siteUrl).href,
    description: description ?? 'B2B exporter of South Indian rice, non-basmati and broken rice, jaggery, arecanut, groundnuts, coconut and copra, ginger and turmeric, based in Bengaluru, India.',
    email,
    telephone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: real(site.address.street),
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: real(site.address.postalCode),
      addressCountry: site.address.country,
    },
    areaServed: 'Worldwide',
    knowsLanguage: languages,
    contactPoint: telephone
      ? [{ '@type': 'ContactPoint', contactType: 'sales', telephone, email, areaServed: 'Worldwide', availableLanguage: languages }]
      : undefined,
    sameAs: site.social.length ? site.social : undefined,
  };
}

export function websiteLd(a: { siteUrl: string; url: string; name: string; description: string; inLanguage: string }) {
  return {
    '@context': ctx,
    '@type': 'WebSite',
    '@id': `${a.url}#website`,
    name: a.name,
    url: a.url,
    description: a.description,
    inLanguage: a.inLanguage,
    publisher: { '@id': orgId(a.siteUrl) },
  };
}

export function itemListLd(a: { id?: string; name: string; items: { name: string; url: string; image?: string }[] }) {
  return {
    '@context': ctx,
    '@type': 'ItemList',
    '@id': a.id,
    name: a.name,
    numberOfItems: a.items.length,
    itemListElement: a.items.map((i, idx) => ({ '@type': 'ListItem', position: idx + 1, name: i.name, url: i.url, image: i.image })),
  };
}

// Google product taxonomy paths, so Product.category says what the goods are instead of "Products".
const food = 'Food, Beverages & Tobacco > Food Items';
export const productCategory: Record<string, string> = {
  rice: `${food} > Grains, Rice & Cereal > Rice`,
  'non-basmati-rice': `${food} > Grains, Rice & Cereal > Rice`,
  'broken-rice': `${food} > Grains, Rice & Cereal > Rice`,
  jaggery: `${food} > Cooking & Baking Ingredients > Sugars & Sweeteners`,
  arecanut: `${food} > Nuts & Seeds`,
  groundnuts: `${food} > Nuts & Seeds`,
  'coconut-copra': `${food} > Nuts & Seeds`,
  ginger: `${food} > Seasonings & Spices > Herbs & Spices`,
  turmeric: `${food} > Seasonings & Spices > Herbs & Spices`,
  cashew: `${food} > Nuts & Seeds`,
  'coco-pith': 'Home & Garden > Lawn & Garden > Gardening',
};

export function productLd(a: {
  name: string; description: string; url: string; image: string | string[]; brand: string; siteUrl?: string;
  category?: string; keywords?: string[]; varieties: { name: string; specs?: { name: string; value: string }[] }[];
}) {
  return {
    '@context': ctx,
    '@type': 'Product',
    '@id': `${a.url}#product`,
    name: a.name,
    description: a.description,
    url: a.url,
    image: a.image,
    brand: { '@type': 'Brand', name: a.brand },
    manufacturer: a.siteUrl ? { '@id': orgId(a.siteUrl) } : undefined,
    category: a.category,
    keywords: a.keywords?.join(', '),
    countryOfOrigin: { '@type': 'Country', name: 'India' },
    // Varieties as product models (hasVariant belongs to ProductGroup, which needs per-variant offers we do not publish).
    // Each model carries the spec rows its table shows on the page.
    model: a.varieties.map((v) => ({
      '@type': 'ProductModel', name: v.name,
      additionalProperty: v.specs?.length ? v.specs.map((s) => ({ '@type': 'PropertyValue', name: s.name, value: s.value })) : undefined,
    })),
  };
}

export function faqLd(items: { q: string; a: string }[]) {
  return {
    '@context': ctx,
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })),
  };
}

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    '@context': ctx,
    '@type': 'BreadcrumbList',
    '@id': items.length ? `${items[items.length - 1].url}#breadcrumb` : undefined,
    itemListElement: items.map((i, idx) => ({ '@type': 'ListItem', position: idx + 1, name: i.name, item: i.url })),
  };
}

export function articleLd(a: { title: string; description: string; url: string; image: string; date: Date; locale: string; siteUrl?: string; keywords?: string[] }) {
  const org = a.siteUrl
    ? { '@type': 'Organization', '@id': orgId(a.siteUrl), name: 'GoodBiz Agri', logo: { '@type': 'ImageObject', url: new URL('/icon-512.png', a.siteUrl).href } }
    : { '@type': 'Organization', name: 'GoodBiz Agri' };
  return {
    '@context': ctx,
    '@type': 'Article',
    '@id': `${a.url}#article`,
    headline: a.title,
    description: a.description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${a.url}#webpage` },
    image: a.image,
    datePublished: a.date.toISOString(),
    dateModified: a.date.toISOString(),
    author: a.siteUrl ? { '@id': orgId(a.siteUrl) } : { '@type': 'Organization', name: 'GoodBiz Agri' },
    publisher: org,
    keywords: a.keywords?.join(', '),
    inLanguage: a.locale,
  };
}

/**
 * The page itself, tying the graph together: which site it belongs to, who publishes it, its breadcrumb and
 * what it is about (the product, article or list that the page's other blocks describe by @id).
 */
export function webPageLd(a: {
  type: 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage'; url: string; name: string; description: string;
  inLanguage: string; siteUrl: string; websiteUrl: string; breadcrumb?: boolean; mainEntity?: string; dateModified?: Date;
}) {
  return {
    '@context': ctx,
    '@type': a.type,
    '@id': `${a.url}#webpage`,
    url: a.url,
    name: a.name,
    description: a.description,
    inLanguage: a.inLanguage,
    isPartOf: { '@id': `${a.websiteUrl}#website` },
    // The company writes every page; naming it as author answers Google's "who created this" question.
    author: { '@id': orgId(a.siteUrl) },
    publisher: { '@id': orgId(a.siteUrl) },
    breadcrumb: a.breadcrumb ? { '@id': `${a.url}#breadcrumb` } : undefined,
    mainEntity: a.mainEntity ? { '@id': a.mainEntity } : undefined,
    dateModified: a.dateModified?.toISOString().slice(0, 10),
  };
}
