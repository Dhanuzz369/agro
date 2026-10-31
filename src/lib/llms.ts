// Plain-text summaries for AI answer engines (/llms.txt and /llms-full.txt). English, facts only, no tariff codes.
import { getLocalizedProducts, getSite } from './catalog';
import { placeLabel } from '../data/places';
import { publishedPosts } from './blog';
import { postLocale, postSlug } from './blog-pure';
import { isPlaceholder } from './site';
import { createT, type UiKey } from '../i18n/t';
import { localeLabels, locales } from '../i18n/config';

export async function llmsText(site: URL, full: boolean): Promise<string> {
  const s = await getSite();
  const products = await getLocalizedProducts('en');
  const t = createT('en');
  const u = (p: string) => new URL(p, site).href;
  const phone = isPlaceholder(s.phone) ? null : s.phone;
  const email = isPlaceholder(s.email) ? null : s.email;
  const wa = isPlaceholder(s.whatsapp) ? null : `https://wa.me/${s.whatsapp.replace(/\D/g, '')}`;

  const out: string[] = [
    '# GoodBiz Agri',
    '',
    `> GoodBiz Agri is a B2B agro products exporter based in ${s.address.city}, ${s.address.region}, India. It exports South Indian rice (Sona Masoori, Ponni, Kerala Matta, Seeraga Samba, idli rice), non-basmati rice (IR64, Swarna, IR36), 100% broken rice, jaggery (including palm jaggery / karupatti), arecanut (betel nut, supari), groundnut kernels (peanuts), coconut and copra (Tiptur ball copra, milling copra), dry and fresh ginger, turmeric (fingers, bulbs, powder), cashew kernels (W180–W450 wholes, scorched wholes, splits, butts and pieces) and coco pith (cocopeat blocks, grow bags, pith and chip mixes, bricks, husk chips) to importers in ${s.stats.countries}+ countries. Prices are quoted FOB, CFR or CIF from the Indian port that suits the order.`,
    '',
    '## Company',
    `- Name: ${s.name}`,
    `- Based in: ${s.address.city}, ${s.address.region}, India`,
    `- Business: exporter and supplier of agro commodities sourced from producing markets (APMC yards), mills, processors and traders in Karnataka, Tamil Nadu, Kerala and Andhra Pradesh.`,
    `- Registrations: ${s.registrations.filter((r) => r.held).map((r) => r.name).join(', ')}.`,
    `- Quality: every lot is cleaned, graded and lab-tested for moisture, aflatoxin and pesticide residue (coco pith for EC, pH and sand); third-party inspection (SGS, Bureau Veritas or the buyer's nominee) on request.`,
    `- Documents with each shipment: certificate of origin, phytosanitary certificate, fumigation certificate where the destination requires it, FSSAI licence (food products), APEDA / Spices Board registration (for the products they cover), certificate of analysis.`,
    `- Packing: PP, jute, BOPP, paper or vacuum bags; private label on request.`,
    '',
    '## Products',
    ...products.map((p) => {
      const vs = p.data.varieties.map((v) => p.text.varieties[v.id]?.name ?? v.id).join(', ');
      return `- [${p.text.name}](${u(`/products/${p.slug}`)}): ${p.text.summary} Varieties: ${vs}.`;
    }),
    '',
    '## How to order',
    `1. Send the product, variety, quantity (metric tonnes or 20/40 ft containers), destination port and Incoterm through the [quote form](${u('/contact')})${wa ? `, on [WhatsApp](${wa})` : ''}${email ? ` or by email to ${email}` : ''}.`,
    '2. GoodBiz Agri replies within one business day with specifications, packing options and an FOB, CFR or CIF price.',
    '3. Pre-shipment samples are sent by courier; the courier cost is adjusted against the first order.',
    '4. Payment by irrevocable letter of credit at sight, or advance against documents for established buyers. Shipment usually 2–4 weeks after confirmation.',
    '',
    '## Contact',
    `- Request a quote: ${u('/contact')}`,
    ...(phone ? [`- Phone / WhatsApp: ${phone}`] : []),
    ...(email ? [`- Email: ${email}`] : []),
    '',
    '## Languages',
    `- Full site in ${locales.map((l) => localeLabels[l]).join(', ')}: ${locales.map((l) => u(l === 'en' ? '/' : `/${l}`)).join(' ')}`,
    '',
    '## Optional',
    `- [About GoodBiz Agri](${u('/about')})`,
    `- [Insights and buyer guides](${u('/blog')})`,
    `- [Full product detail for AI assistants](${u('/llms-full.txt')})`,
  ];

  if (full) {
    out.push('', '---', '', '# Product detail');
    for (const p of products) {
      out.push('', `## ${p.text.name}`, '', p.text.summary, '', p.text.sourcingStory, '');
      out.push(`- Page: ${u(`/products/${p.slug}`)}`);
      out.push(`- Also searched as: ${p.text.seo.keywords.join('; ')}`);
      out.push(`- Sourced from: ${p.data.regions.map(placeLabel).join('; ')}`);
      if (p.data.markets.length) out.push(`- Markets we buy in: ${p.data.markets.join(', ')}`);
      out.push(`- Shelf life: ${p.data.shelfLife}`);
      out.push(`- Packing: ${p.data.packing.join('; ')}`);
      out.push(`- Container load: 20 ft ${p.data.containerLoad.ft20}; 40 ft ${p.data.containerLoad.ft40}`);
      out.push('', '### Varieties');
      for (const v of p.data.varieties) {
        const vt = p.text.varieties[v.id];
        const specs = v.specs.map((sp) => `${t(`spec.${sp.key}` as UiKey)} ${sp.value}`).join('; ');
        out.push(`- ${vt?.name ?? v.id}: ${vt?.description ?? ''} ${v.region ? `Origin ${placeLabel(v.region)}. ` : ''}Specs: ${specs}. Packing: ${v.packing.join('; ')}.`);
      }
      out.push('', '### FAQ');
      for (const f of p.text.faq) out.push(`- Q: ${f.q}`, `  A: ${f.a}`);
    }
    const posts = (await publishedPosts()).filter((p) => postLocale(p.id) === 'en');
    if (posts.length) {
      out.push('', '# Articles');
      for (const p of posts) out.push(`- [${p.data.title}](${u(`/blog/${postSlug(p.id)}`)}): ${p.data.description}`);
    }
  }
  return out.join('\n') + '\n';
}
