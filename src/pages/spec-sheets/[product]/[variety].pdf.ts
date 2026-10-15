import type { APIRoute, GetStaticPaths } from 'astro';
import { buildSpecSheet } from '../../../lib/specsheet';
import { getLocalizedProducts, getSite } from '../../../lib/catalog';
import { createT, type UiKey } from '../../../i18n/t';
import { places } from '../../../data/places';
import { isPlaceholder } from '../../../lib/site';

export const getStaticPaths: GetStaticPaths = async () => {
  const products = await getLocalizedProducts('en');
  return products.flatMap((p) => p.data.varieties.map((v) => ({ params: { product: p.slug, variety: v.id }, props: { p, v } })));
};

export const GET: APIRoute = async ({ props, site }) => {
  const { p, v } = props as { p: Awaited<ReturnType<typeof getLocalizedProducts>>[number]; v: Awaited<ReturnType<typeof getLocalizedProducts>>[number]['data']['varieties'][number] };
  const t = createT('en');
  const s = await getSite();
  const bytes = await buildSpecSheet({
    productName: p.text.name, varietyName: p.text.varieties[v.id]?.name ?? v.id, hsn: v.hsn,
    region: `${places[v.region].name}, ${places[v.region].state}`, market: v.market,
    specs: v.specs.map((x) => ({ label: t(`spec.${x.key}` as UiKey), value: x.value })),
    packing: v.packing, moq: p.data.moq, ports: p.data.ports.map((id) => places[id].name).join(', '),
    contact: isPlaceholder(s.email) ? 'goodbizagri.com/contact' : s.email,
    url: new URL(`/products/${p.slug}`, site).href,
  });
  return new Response(bytes, { headers: { 'Content-Type': 'application/pdf' } });
};
