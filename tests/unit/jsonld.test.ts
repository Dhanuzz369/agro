import { describe, it, expect } from 'vitest';
import { organizationLd, productLd, faqLd, breadcrumbLd, articleLd, websiteLd, itemListLd, e164Dashed } from '../../src/lib/jsonld';

const site = {
  name: 'GoodBiz Agri', legalName: 'GoodBiz Agri', foundingCity: 'Bengaluru',
  address: { street: 'X', city: 'Bengaluru', region: 'Karnataka', postalCode: '560001', country: 'IN' as const },
  email: 'a@b.c', phone: '+91', whatsapp: '91', leadEndpoint: 'k', registrations: [], stats: { countries: 70, products: 9, markets: 18, ports: 4 }, social: [],
};

describe('jsonld', () => {
  it('organization', () => {
    const o = organizationLd(site, 'https://x.com') as any;
    expect(o['@type']).toBe('Organization');
    expect(o.address.addressCountry).toBe('IN');
    expect(o.url).toBe('https://x.com/');
  });
  it('omits REPLACE: placeholders from organization contact', () => {
    const o = organizationLd({ ...site, email: 'REPLACE: x', phone: 'REPLACE: y' }, 'https://x.com') as any;
    expect(o.email).toBeUndefined();
    expect(o.telephone).toBeUndefined();
  });
  it('product lists varieties as models, carries no HSN code and offers no price', () => {
    const p = productLd({ name: 'Turmeric', description: 'd', url: 'https://x.com/products/turmeric', image: 'https://x.com/i.jpg', brand: 'GoodBiz Agri', category: 'Products', keywords: ['a', 'b'], varieties: [{ name: 'Erode' }] }) as any;
    expect(p['@type']).toBe('Product');
    expect(p.model).toEqual([{ '@type': 'ProductModel', name: 'Erode' }]);
    expect(p.hasVariant).toBeUndefined();
    expect(p.keywords).toBe('a, b');
    expect(p.countryOfOrigin).toEqual({ '@type': 'Country', name: 'India' });
    expect(p.aggregateRating).toBeUndefined();
    expect(p.additionalProperty).toBeUndefined();
    expect(JSON.stringify(p)).not.toMatch(/HSN/);
    expect(p.offers).toBeUndefined();
  });
  it('organization contact point uses the dashed international number and real fields only', () => {
    const o = JSON.parse(JSON.stringify(organizationLd({ ...site, phone: '+91 88847 99369', address: { ...site.address, street: 'REPLACE: street', postalCode: 'REPLACE: 5600xx' } }, 'https://x.com'))) as any;
    expect(o.contactPoint[0]).toMatchObject({ '@type': 'ContactPoint', telephone: '+91-8884799369', contactType: 'sales' });
    expect(o.contactPoint[0].availableLanguage).toHaveLength(9);
    expect(o.address.streetAddress).toBeUndefined();
    expect(o.address.postalCode).toBeUndefined();
    expect(JSON.stringify(o)).not.toMatch(/REPLACE/);
  });
  it('formats Indian numbers', () => {
    expect(e164Dashed('+91 88847 99369')).toBe('+91-8884799369');
    expect(e164Dashed('REPLACE: x')).toBeUndefined();
  });
  it('website and item list', () => {
    const w = websiteLd({ siteUrl: 'https://x.com', url: 'https://x.com/', name: 'GoodBiz Agri', description: 'd', inLanguage: 'en' }) as any;
    expect(w['@type']).toBe('WebSite');
    expect(w.publisher).toEqual({ '@id': 'https://x.com/#organization' });
    const l = itemListLd({ name: 'P', items: [{ name: 'A', url: 'u1' }, { name: 'B', url: 'u2' }] }) as any;
    expect(l.numberOfItems).toBe(2);
    expect(l.itemListElement[1]).toMatchObject({ '@type': 'ListItem', position: 2, name: 'B', url: 'u2' });
  });
  it('faq', () => {
    const f = faqLd([{ q: 'Q', a: 'A' }]) as any;
    expect(f.mainEntity[0]).toEqual({ '@type': 'Question', name: 'Q', acceptedAnswer: { '@type': 'Answer', text: 'A' } });
  });
  it('breadcrumb positions start at 1', () => {
    const b = breadcrumbLd([{ name: 'Home', url: 'u1' }, { name: 'Products', url: 'u2' }]) as any;
    expect(b.itemListElement.map((i: any) => i.position)).toEqual([1, 2]);
  });
  it('article dates are ISO', () => {
    const a = articleLd({ title: 't', description: 'd', url: 'u', image: 'i', date: new Date('2026-10-01'), locale: 'en' }) as any;
    expect(a.author).toEqual({ '@type': 'Organization', name: 'GoodBiz Agri' });
    expect(a.datePublished).toBe('2026-10-01T00:00:00.000Z');
    expect(a.inLanguage).toBe('en');
  });
});
