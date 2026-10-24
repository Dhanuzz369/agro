import type { APIRoute } from 'astro';

// Search and AI crawlers are welcome: being quoted by answer engines is part of how buyers find us.
export const aiBots = [
  'Googlebot', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended',
  'ClaudeBot', 'Claude-Web', 'Claude-SearchBot', 'Claude-User', 'anthropic-ai', 'Applebot', 'Applebot-Extended', 'CCBot',
  'DuckDuckBot', 'YandexBot', 'Baiduspider', 'meta-externalagent', 'Amazonbot', 'cohere-ai', 'MistralAI-User',
];

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('/sitemap-index.xml', site).href;
  const lines = [
    'User-agent: *',
    'Allow: /',
    '',
    ...aiBots.flatMap((b) => [`User-agent: ${b}`, 'Allow: /', '']),
    `Sitemap: ${sitemap}`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
