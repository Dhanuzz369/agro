// AI discovery files (/ai/summary.json, /ai/faq.json, /ai/service.json, /.well-known/ai.txt), built from the same
// site and product data as llms.txt so they never drift from the pages. English only, like llms.txt.
import { getLocalizedProducts, getSite } from './catalog';
import { isPlaceholder } from './site';
import { homeFaq } from '../i18n/home-faq';
import { createT } from '../i18n/t';

const json = (data: unknown) =>
  new Response(JSON.stringify(data, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });

async function basics(site: URL) {
  const s = await getSite();
  const products = await getLocalizedProducts('en');
  const u = (p: string) => new URL(p, site).href;
  const contact = {
    email: isPlaceholder(s.email) ? undefined : s.email,
    phone: isPlaceholder(s.phone) ? undefined : s.phone,
    whatsapp: isPlaceholder(s.whatsapp) ? undefined : `https://wa.me/${s.whatsapp.replace(/\D/g, '')}`,
    quote: u('/contact'),
  };
  return { s, products, u, contact };
}

export async function aiSummary(site: URL) {
  const { s, products, u, contact } = await basics(site);
  return json({
    name: s.name,
    url: u('/'),
    description: createT('en')('meta.homeDescription'),
    type: 'B2B agro products exporter',
    location: `${s.address.city}, ${s.address.region}, India`,
    languages: ['en', 'ar', 'fr', 'es', 'pt', 'ru', 'zh', 'id', 'de'],
    products: products.map((p) => ({ name: p.text.name, url: u(`/products/${p.slug}`), summary: p.text.summary })),
    incoterms: ['FOB', 'CFR', 'CIF'],
    contact,
    resources: { llms: u('/llms.txt'), llmsFull: u('/llms-full.txt'), sitemap: u('/sitemap-index.xml'), faq: u('/ai/faq.json'), service: u('/ai/service.json') },
  });
}

export async function aiFaq(site: URL) {
  const { products, u } = await basics(site);
  const faqs = [
    ...homeFaq('en').map((f) => ({ question: f.q, answer: f.a, url: u('/') })),
    ...products.flatMap((p) => p.text.faq.map((f) => ({ question: f.q, answer: f.a, url: u(`/products/${p.slug}`) }))),
  ];
  return json({ name: 'GoodBiz Agri buyer FAQ', faqs });
}

export async function aiService(site: URL) {
  const { s, products, u, contact } = await basics(site);
  return json({
    name: `${s.name} export supply`,
    description: 'Sourcing and export of South Indian agro commodities to importers worldwide, quoted FOB, CFR or CIF.',
    capabilities: products.map((p) => ({
      name: `Export of ${p.text.name}`,
      url: u(`/products/${p.slug}`),
      origin: p.text.originLine,
      varieties: p.data.varieties.map((v) => p.text.varieties[v.id]?.name ?? v.id),
      containerLoad: { '20ft': p.data.containerLoad.ft20, '40ft': p.data.containerLoad.ft40 },
      specSheets: p.data.varieties.map((v) => u(`/spec-sheets/${p.slug}/${v.id}.pdf`)),
    })),
    incoterms: ['FOB', 'CFR', 'CIF'],
    howToOrder: [
      'Send the product, variety, quantity, destination port and Incoterm through the quote form or WhatsApp.',
      'GoodBiz Agri replies within one business day with specifications, packing options and a price.',
    ],
    contact,
  });
}

export async function aiTxt(site: URL) {
  const { s, u } = await basics(site);
  const email = isPlaceholder(s.email) ? '' : s.email;
  return new Response(
    [
      `# AI usage policy for ${new URL(site).host}`,
      '# Same choice as robots.txt: search, answers and training are all welcome. Please cite the page you used.',
      'User-Agent: *',
      'Allow: /',
      'Search: allowed',
      'AI-Input: allowed',
      'AI-Training: allowed',
      `Attribution: ${s.name}, ${u('/')}`,
      email && `Contact: ${email}`,
      `Summary: ${u('/ai/summary.json')}`,
      `LLMs: ${u('/llms.txt')}`,
      '',
    ].filter((l) => l !== '').join('\n') + '\n',
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
}
