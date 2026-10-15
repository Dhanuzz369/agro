import { resolveTarget, safeStorage, machineFallbackUrl, googTransCookie } from '../lib/lang-switch';
import type { Locale } from '../i18n/config';

const root = document.querySelector<HTMLElement>('[data-lang-root]');
if (root) {
  const available: Locale[] = JSON.parse(root.dataset.available ?? '[]');
  const dialog = root.querySelector('dialog')!;
  const search = root.querySelector<HTMLInputElement>('[data-lang-search]')!;
  const options = [...root.querySelectorAll<HTMLButtonElement>('[data-lang-option]')];

  root.querySelector('[data-lang-open]')!.addEventListener('click', () => { dialog.showModal(); search.focus(); });
  root.querySelector('[data-lang-close]')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    for (const o of options) o.closest('li')!.hidden = !!q && !o.dataset.search!.includes(q);
  });

  let inFlight = false;
  function machineTranslate(code: string) {
    if (inFlight) return;
    inFlight = true;
    document.cookie = googTransCookie(code, document.documentElement.lang.split('-')[0]);
    const fallback = () => { location.href = machineFallbackUrl(code, location.href); };
    const timer = setTimeout(fallback, 4000);
    (window as unknown as Record<string, unknown>).gbTranslateInit = () => {
      clearTimeout(timer);
      const g = (window as unknown as { google?: { translate?: { TranslateElement?: new (o: object, id: string) => unknown } } }).google;
      if (!g?.translate?.TranslateElement) return fallback();
      new g.translate.TranslateElement({ pageLanguage: document.documentElement.lang.split('-')[0], autoDisplay: false }, 'google_translate_element');
      dialog.close();
    };
    const s = document.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=gbTranslateInit';
    s.async = true;
    s.onerror = () => { clearTimeout(timer); fallback(); };
    document.head.append(s);
  }

  for (const o of options) {
    o.addEventListener('click', () => {
      const code = o.dataset.code!;
      safeStorage.set('gb.lang', code);
      const target = resolveTarget(code, location.pathname, available);
      if (target.type === 'core') {
        document.cookie = 'googtrans=; path=/; max-age=0';
        location.href = target.href + location.search;
      } else {
        machineTranslate(target.gtCode);
      }
    });
  }

  // Re-apply a previously chosen machine language on page load (no dialog interaction).
  const cookieCode = document.cookie.match(/(?:^|;\s*)googtrans=\/[^/]*\/([^;]+)/)?.[1];
  const saved = safeStorage.get('gb.lang');
  const persisted = [cookieCode, saved].find((c) => c && c !== 'en' && resolveTarget(c!, location.pathname, available).type === 'machine');
  if (persisted) machineTranslate(persisted);
}
