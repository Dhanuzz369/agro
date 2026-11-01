import { track } from '../lib/analytics';

// Contact taps are the site's other way in besides the quote form; one listener covers every link on the page.
const events: [string, string][] = [['a[href^="https://wa.me/"]', 'whatsapp_click'], ['a[href^="mailto:"]', 'email_click'], ['a[href^="tel:"]', 'phone_click']];

document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest?.('a');
  if (!a) return;
  const hit = events.find(([sel]) => a.matches(sel));
  if (!hit) return;
  const placement = a.closest('[data-quote-form]') ? 'quote_fallback' : a.matches('[data-whatsapp]') ? 'floating_button' : a.closest('footer') ? 'footer' : 'page';
  track(hit[1], { placement });
});
