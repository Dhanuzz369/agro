import { parsePrefill, validateQuote, submitQuote, summarizeQuote, type QuoteInput } from '../lib/quote';

type CatalogItem = { slug: string; name: string; varieties: { id: string; name: string }[] };

for (const form of document.querySelectorAll<HTMLFormElement>('[data-quote-form]')) {
  const catalog: CatalogItem[] = JSON.parse(form.dataset.catalog!);
  const msgs: Record<string, string> = JSON.parse(form.dataset.msgs!);
  const product = form.elements.namedItem('product') as HTMLSelectElement;
  const variety = form.elements.namedItem('variety') as HTMLSelectElement;
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const startedAt = Date.now();
  let busy = false;

  const fillVarieties = (slug: string) => {
    variety.replaceChildren(new Option(msgs.any, ''));
    for (const v of catalog.find((c) => c.slug === slug)?.varieties ?? []) variety.add(new Option(v.name, v.id));
  };
  product.addEventListener('change', () => fillVarieties(product.value));

  const pre = parsePrefill(location.search, catalog.map((c) => ({ slug: c.slug, varieties: c.varieties.map((v) => v.id) })));
  if (pre.product) { product.value = pre.product; fillVarieties(pre.product); }
  if (pre.variety) variety.value = pre.variety;

  const read = (): QuoteInput => {
    const fd = new FormData(form);
    const s = (k: string) => String(fd.get(k) ?? '');
    return {
      product: s('product'), variety: s('variety'), quantity: s('quantity'), unit: s('unit') as QuoteInput['unit'],
      country: s('country'), port: s('port'), incoterm: s('incoterm') as QuoteInput['incoterm'], packing: s('packing'),
      name: s('name'), company: s('company'), email: s('email'), whatsapp: s('whatsapp'), message: s('message'),
      botcheck: fd.get('botcheck') ? 'on' : '', startedAt,
    };
  };

  const labelsFor = (i: QuoteInput) => {
    const p = catalog.find((c) => c.slug === i.product);
    return { product: p?.name ?? i.product, variety: p?.varieties.find((v) => v.id === i.variety)?.name ?? '' };
  };

  // Move focus to the outcome heading so keyboard and screen-reader users land on the result.
  const setState = (state: 'success' | 'error') => {
    form.dataset.formState = state;
    form.querySelector<HTMLElement>(`[data-show="${state}"] [data-status-heading]`)?.focus();
  };

  const showErrors = (errors: Partial<Record<string, string>>) => {
    form.querySelectorAll<HTMLElement>('.qf__err').forEach((el) => { el.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    let first: HTMLElement | null = null;
    for (const [field, code] of Object.entries(errors)) {
      const err = form.querySelector<HTMLElement>(`#err-${field}`);
      const input = form.elements.namedItem(field) as HTMLElement | null;
      if (err) err.textContent = msgs[code!];
      input?.setAttribute('aria-invalid', 'true');
      first ??= input;
    }
    first?.focus();
  };

  form.addEventListener('input', (e) => {
    const el = e.target as HTMLElement;
    if (el.getAttribute('aria-invalid')) {
      el.removeAttribute('aria-invalid');
      const err = form.querySelector(`#err-${(el as HTMLInputElement).name}`);
      if (err) err.textContent = '';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    const input = read();
    const result = validateQuote(input, Date.now());
    if (!result.ok) {
      if (result.spam) { setState('success'); return; } // silently drop bots
      showErrors(result.errors);
      return;
    }
    busy = true;
    button.textContent = msgs.sending;
    button.setAttribute('aria-busy', 'true');
    const labels = labelsFor(input);
    const key = form.dataset.key ?? '';
    let status: 'ok' | 'error' = 'error';
    if (key) {
      if (result.waitMs > 0) await new Promise((r) => setTimeout(r, result.waitMs));
      status = await submitQuote(fetch, key, input, labels);
    }
    busy = false;
    button.textContent = msgs.submit;
    button.removeAttribute('aria-busy');
    if (status === 'ok') { setState('success'); return; }
    const text = summarizeQuote(input, labels);
    const wa = form.querySelector<HTMLAnchorElement>('[data-fallback="whatsapp"]');
    if (wa && form.dataset.wa) wa.href = `${form.dataset.wa}?text=${encodeURIComponent(text)}`;
    const mail = form.querySelector<HTMLAnchorElement>('[data-fallback="email"]');
    if (mail && form.dataset.mail) mail.href = `${form.dataset.mail}?subject=${encodeURIComponent(`Quote request: ${labels.product}`)}&body=${encodeURIComponent(text)}`;
    setState('error');
  });
}
