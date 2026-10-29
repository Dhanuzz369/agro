// Tell Bing, Yandex, Naver and other IndexNow engines which pages exist, so they recrawl them soon after a deploy.
// Run by hand once the deploy is live:  npm run indexnow   (optionally: npm run indexnow -- /products/turmeric /fr)
// With no paths it submits every URL in the live sitemaps. Google does not use IndexNow; it reads the sitemap.
const SITE = process.env.SITE_URL ?? 'https://goodbizagro.com';
const KEY = 'dd321df2493bc3ea4f3404ce4d56de5b'; // must match public/dd321df2493bc3ea4f3404ce4d56de5b.txt

async function sitemapUrls() {
  const index = await (await fetch(new URL('/sitemap-index.xml', SITE))).text();
  const maps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const pages = await Promise.all(maps.map(async (m) => (await (await fetch(m)).text()).matchAll(/<url><loc>([^<]+)<\/loc>/g)));
  return pages.flatMap((it) => [...it].map((m) => m[1]));
}

const args = process.argv.slice(2);
const urls = args.length ? args.map((p) => new URL(p, SITE).href) : await sitemapUrls();
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: new URL(`/${KEY}.txt`, SITE).href, urlList: urls }),
});
console.log(`IndexNow: ${res.status} ${res.statusText} for ${urls.length} URL(s)`);
if (res.status >= 300) process.exitCode = 1;
