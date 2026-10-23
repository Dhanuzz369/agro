import type { APIRoute, GetStaticPaths } from 'astro';
import { publishedPosts } from '../../lib/blog';
import { renderOg } from '../../lib/og';
import { getLocalizedProducts } from '../../lib/catalog';
import { postSlug, postLocale } from '../../lib/blog-pure';

export const getStaticPaths: GetStaticPaths = async () => {
  const products = await getLocalizedProducts('en');
  const posts = (await publishedPosts()).filter((p) => postLocale(p.id) === 'en');
  const pages = [
    { slug: 'home', eyebrow: 'Agro exporters · Bengaluru, India', title: "South India's harvest, shipped to 70+ countries" },
    { slug: 'products', eyebrow: 'Product range', title: 'Rice, spices, arecanut, jaggery, groundnuts and copra' },
    { slug: 'blog', eyebrow: 'Insights', title: 'Market updates and buyer guides' },
    { slug: 'about', eyebrow: 'About', title: 'Buyers in the markets where it grows' },
    { slug: 'contact', eyebrow: 'Contact', title: 'Request a quote' },
    ...products.map((p) => ({ slug: `products/${p.slug}`, eyebrow: 'Product range', title: p.text.name, subtitle: p.text.originLine })),
    ...posts.map((p) => ({ slug: `blog/${postSlug(p.id)}`, eyebrow: 'Insights', title: p.data.title })),
  ];
  return pages.map(({ slug, ...props }) => ({ params: { slug }, props }));
};

export const GET: APIRoute = async ({ props }) =>
  new Response(await renderOg(props as { eyebrow: string; title: string; subtitle?: string }), { headers: { 'Content-Type': 'image/png' } });
