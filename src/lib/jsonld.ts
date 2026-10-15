import type { SiteData } from './schemas';

const ctx = 'https://schema.org';
const real = (v: string) => (v.startsWith('REPLACE:') ? undefined : v);

export function organizationLd(site: SiteData, siteUrl: string) {
  const url = new URL('/', siteUrl).href;
  return {
    '@context': ctx,
    '@type': 'Organization',
    name: site.name,
    legalName: real(site.legalName),
    url,
    logo: new URL('/favicon.svg', siteUrl).href,
    email: real(site.email),
    telephone: real(site.phone),
    address: {
      '@type': 'PostalAddress',
      streetAddress: real(site.address.street),
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: real(site.address.postalCode),
      addressCountry: site.address.country,
    },
    areaServed: 'Worldwide',
    sameAs: site.social.length ? site.social : undefined,
  };
}

export function productLd(a: { name: string; description: string; url: string; image: string; hsn: string[]; brand: string; varieties: { name: string; hsn: string }[] }) {
  return {
    '@context': ctx,
    '@type': 'Product',
    name: a.name,
    description: a.description,
    url: a.url,
    image: a.image,
    brand: { '@type': 'Brand', name: a.brand },
    countryOfOrigin: { '@type': 'Country', name: 'India' },
    additionalProperty: a.hsn.map((h) => ({ '@type': 'PropertyValue', name: 'HSN code', value: h })),
    hasVariant: a.varieties.map((v) => ({
      '@type': 'Product',
      name: v.name,
      additionalProperty: [{ '@type': 'PropertyValue', name: 'HSN code', value: v.hsn }],
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
    itemListElement: items.map((i, idx) => ({ '@type': 'ListItem', position: idx + 1, name: i.name, item: i.url })),
  };
}

export function articleLd(a: { title: string; description: string; url: string; image: string; date: Date; locale: string }) {
  return {
    '@context': ctx,
    '@type': 'Article',
    headline: a.title,
    description: a.description,
    mainEntityOfPage: a.url,
    image: a.image,
    datePublished: a.date.toISOString(),
    author: { '@type': 'Organization', name: 'GoodBiz Agri' },
    publisher: { '@type': 'Organization', name: 'GoodBiz Agri' },
    inLanguage: a.locale,
  };
}
