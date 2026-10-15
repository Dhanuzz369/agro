import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { renderOg } from '../../lib/og';
import { getLocalizedProducts, getHsnEntries } from '../../lib/catalog';
import { formatHsn } from '../../lib/hsn';
import { postSlug, postLocale } from '../../lib/blog-pure';

export const getStaticPaths: GetStaticPaths = async () => {
  const products = await getLocalizedProducts('en');
  const hsn = await getHsnEntries('en');
  const posts = (await getCollection('blog')).filter((p) => postLocale(p.id) === 'en');
  const pages = [
    { slug: 'home', eyebrow: 'Agro exporters · Bengaluru, India', title: "South India's harvest, shipped to 70+ countries" },
    { slug: 'products', eyebrow: 'Product range', title: 'Rice, spices, arecanut, jaggery, groundnuts and copra' },
    { slug: 'blog', eyebrow: 'Insights', title: 'Market updates and buyer guides' },
    { slug: 'about', eyebrow: 'About', title: 'Buyers in the markets where it grows' },
    { slug: 'contact', eyebrow: 'Contact', title: 'Request a quote' },
    ...products.map((p) => ({ slug: `products/${p.slug}`, eyebrow: `HSN ${p.data.hsn.map((h) => formatHsn(h.code)).join(' · ')}`, title: p.text.name, subtitle: p.text.originLine })),
    ...hsn.map((h) => ({ slug: `hsn/${h.code}`, eyebrow: 'HSN reference', title: `HSN ${formatHsn(h.code)} — ${h.text.title}` })),
    ...posts.map((p) => ({ slug: `blog/${postSlug(p.id)}`, eyebrow: 'Insights', title: p.data.title })),
  ];
  return pages.map(({ slug, ...props }) => ({ params: { slug }, props }));
};

export const GET: APIRoute = async ({ props }) =>
  new Response(await renderOg(props as { eyebrow: string; title: string; subtitle?: string }), { headers: { 'Content-Type': 'image/png' } });
