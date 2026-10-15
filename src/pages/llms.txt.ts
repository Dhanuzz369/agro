import type { APIRoute } from 'astro';
import { getLocalizedProducts, getHsnEntries, getSite } from '../lib/catalog';
import { formatHsn } from '../lib/hsn';
import { places } from '../data/places';

export const GET: APIRoute = async ({ site }) => {
  const s = await getSite();
  const products = await getLocalizedProducts('en');
  const hsn = await getHsnEntries('en');
  const u = (p: string) => new URL(p, site).href;
  const lines = [
    '# GoodBiz Agri',
    '',
    `> Agro commodity exporter based in ${s.address.city}, Karnataka, India. Sources rice, turmeric, ginger, arecanut, jaggery, groundnuts, coconut and copra from producing markets in Karnataka, Tamil Nadu, Kerala and Andhra Pradesh, and ships to ${s.stats.countries}+ countries. Quotes FOB, CFR and CIF.`,
    '',
    '## Products',
    ...products.map((p) => `- [${p.text.name}](${u(`/products/${p.slug}`)}): HSN ${p.data.hsn.map((h) => h.code).join(', ')}. ${p.text.originLine}. Varieties: ${p.data.varieties.map((v) => p.text.varieties[v.id]?.name).join(', ')}.`),
    '',
    '## HSN codes',
    ...hsn.map((h) => `- [${h.code} (${formatHsn(h.code)})](${u(`/hsn/${h.code}`)}): ${h.text.title}${h.verified ? '' : ' (code under verification)'}`),
    '',
    '## Sourcing regions',
    ...[...new Set(products.flatMap((p) => p.data.regions))].map((r) => `- ${places[r].name}, ${places[r].state}`),
    '',
    '## Contact',
    `- [Request a quote](${u('/contact')})`,
    '',
    '## Languages',
    '- Full pages in English, Arabic, French, Spanish, Portuguese, Russian, Chinese (Simplified), Indonesian and German.',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
