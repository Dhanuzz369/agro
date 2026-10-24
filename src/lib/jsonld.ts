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

export function organizationLd(site: SiteData, siteUrl: string) {
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
    description: 'B2B exporter of South Indian rice, non-basmati and broken rice, jaggery, arecanut, groundnuts, coconut and copra, ginger and turmeric, based in Bengaluru, India.',
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

export function itemListLd(a: { name: string; items: { name: string; url: string; image?: string }[] }) {
  return {
    '@context': ctx,
    '@type': 'ItemList',
    name: a.name,
    numberOfItems: a.items.length,
    itemListElement: a.items.map((i, idx) => ({ '@type': 'ListItem', position: idx + 1, name: i.name, url: i.url, image: i.image })),
  };
}

export function productLd(a: {
  name: string; description: string; url: string; image: string | string[]; brand: string; siteUrl?: string;
  category?: string; keywords?: string[]; varieties: { name: string }[];
}) {
  return {
    '@context': ctx,
    '@type': 'Product',
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
    model: a.varieties.map((v) => ({ '@type': 'ProductModel', name: v.name })),
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
    headline: a.title,
    description: a.description,
    mainEntityOfPage: a.url,
    image: a.image,
    datePublished: a.date.toISOString(),
    dateModified: a.date.toISOString(),
    author: { '@type': 'Organization', name: 'GoodBiz Agri' },
    publisher: org,
    keywords: a.keywords?.join(', '),
    inLanguage: a.locale,
  };
}
