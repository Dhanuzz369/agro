import { describe, it, expect } from 'vitest';
import { organizationLd, productLd, faqLd, breadcrumbLd, articleLd } from '../../src/lib/jsonld';

const site = {
  name: 'GoodBiz Agri', legalName: 'GoodBiz Agri', foundingCity: 'Bengaluru',
  address: { street: 'X', city: 'Bengaluru', region: 'Karnataka', postalCode: '560001', country: 'IN' as const },
  email: 'a@b.c', phone: '+91', whatsapp: '91', web3formsKey: 'k', registrations: [], stats: { countries: 70, products: 9, markets: 18, ports: 4 }, social: [],
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
  it('product carries HSN as additionalProperty and offers no price', () => {
    const p = productLd({ name: 'Turmeric', description: 'd', url: 'https://x.com/products/turmeric', image: 'https://x.com/i.jpg', hsn: ['09103020'], brand: 'GoodBiz Agri', varieties: [{ name: 'Erode', hsn: '09103020' }] }) as any;
    expect(p['@type']).toBe('Product');
    expect(p.additionalProperty[0]).toEqual({ '@type': 'PropertyValue', name: 'HSN code', value: '09103020' });
    expect(p.offers).toBeUndefined();
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
    const a = articleLd({ title: 't', description: 'd', url: 'u', image: 'i', date: new Date('2026-10-01'), author: 'A', locale: 'en' }) as any;
    expect(a.datePublished).toBe('2026-10-01T00:00:00.000Z');
    expect(a.inLanguage).toBe('en');
  });
});
