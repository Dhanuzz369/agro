import {
  STEPS, parsePrefill, validateStep, validateQuote, sendLead, leadPayload, summarizeQuote,
  type Step, type QuoteInput, type StepErrors, type Labels,
} from '../lib/quote';

type CatalogItem = { slug: string; name: string; varieties: { id: string; name: string }[] };

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
// Choosing a card moves on by itself, after a beat long enough to see the selection land.
const AUTO_ADVANCE_MS = 260;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

for (const form of document.querySelectorAll<HTMLFormElement>('[data-quote-form]')) {
  const catalog: CatalogItem[] = JSON.parse(form.dataset.catalog!);
  const msgs: Record<string, string> = JSON.parse(form.dataset.msgs!);
  // Read on use, not at load, so the endpoint can be swapped (tests do) without a reload.
  const endpoint = () => form.dataset.endpoint ?? '';
  const rtl = getComputedStyle(form).direction === 'rtl';
  const stepEl = (s: Step) => form.querySelector<HTMLFieldSetElement>(`[data-step="${s}"]`)!;
  const next = form.querySelector<HTMLButtonElement>('[data-next]')!;
  const back = form.querySelector<HTMLButtonElement>('[data-back]')!;
  const count = form.querySelector<HTMLElement>('[data-step-count]')!;
  const fill = form.querySelector<HTMLElement>('[data-fill]')!;
  const leadId = crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const startedAt = Date.now();
  let busy = false;
  let advancing = false;
  let lastPointer = 0;

  // Steps answered by the link the buyer came from ("Quote this variety") are skipped, not shown pre-filled.
  const pre = parsePrefill(location.search, catalog.map((c) => ({ slug: c.slug, varieties: c.varieties.map((v) => v.id) })));
  if (pre.product) form.querySelector<HTMLInputElement>(`input[name="product"][value="${CSS.escape(pre.product)}"]`)!.checked = true;
  const productNow = () => (form.querySelector<HTMLInputElement>('input[name="product"]:checked')?.value ?? '');
  const flow = (): Step[] => STEPS.filter((s) => {
    if (s === 'product') return !pre.product;
    // Until a product is picked, count the variety step so the total doesn't shrink under the buyer.
    if (s === 'variety') return !pre.variety && productNow() !== 'other' && (catalog.find((c) => c.slug === productNow())?.varieties.length ?? 1) > 0;
    return true;
  });

  // Only the chosen product's varieties take part in the form, so FormData never carries another product's pick.
  const syncVarieties = () => {
    const slug = productNow();
    for (const group of form.querySelectorAll<HTMLElement>('[data-for]')) {
      const current = group.dataset.for === slug;
      group.toggleAttribute('data-current', current);
      group.querySelectorAll<HTMLInputElement>('input').forEach((i) => { i.disabled = !current; if (!current) i.checked = false; });
    }
  };
  syncVarieties();
  // Scoped to the product's own group: variety ids repeat across products (turmeric and ginger both have "powder").
  if (pre.variety) form.querySelector<HTMLInputElement>(`[data-for="${CSS.escape(pre.product!)}"] input[value="${CSS.escape(pre.variety)}"]`)!.checked = true;

  const read = (): QuoteInput => {
    const fd = new FormData(form);
    const s = (k: string) => String(fd.get(k) ?? '');
    const choice = s('quantityChoice');
    return {
      name: s('name'), company: s('company'), email: s('email'), whatsapp: s('whatsapp'),
      product: s('product'), productOther: s('productOther'), variety: s('variety'),
      quantity: choice === 'other' ? s('quantityOther') : choice,
      country: s('country'), port: s('port'), incoterm: s('incoterm') as QuoteInput['incoterm'], message: s('message'),
      botcheck: fd.get('botcheck') ? 'on' : '', startedAt,
    };
  };

  const textOf = (input: HTMLInputElement | null) => input?.closest('label')?.querySelector('.qf__term')?.textContent?.trim()
    ?? input?.closest('label')?.textContent?.trim() ?? '';
  const labelsFor = (i: QuoteInput): Labels => {
    const p = catalog.find((c) => c.slug === i.product);
    const choice = form.querySelector<HTMLInputElement>('input[name="quantityChoice"]:checked');
    return {
      product: i.product === 'other' ? i.productOther.trim() : p?.name ?? '',
      variety: p?.varieties.find((v) => v.id === i.variety)?.name ?? '',
      quantity: choice?.value === 'other' ? i.quantity.trim() : textOf(choice),
      incoterm: i.incoterm === 'other' ? msgs.other : i.incoterm,
    };
  };

  const clearErrors = (scope: ParentNode = form) => {
    scope.querySelectorAll<HTMLElement>('.qf__err').forEach((el) => { el.textContent = ''; });
    scope.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  };
  const showErrors = (errors: StepErrors) => {
    clearErrors();
    let first: HTMLElement | null = null;
    for (const [field, code] of Object.entries(errors)) {
      const err = form.querySelector<HTMLElement>(`#err-${field}`);
      const input = form.querySelector<HTMLInputElement>(`[name="${field}"]:not([type="radio"])`)
        ?? form.querySelector<HTMLInputElement>(`[name="${field === 'quantity' ? 'quantityChoice' : field}"]`);
      if (err) err.textContent = msgs[code!];
      input?.setAttribute('aria-invalid', 'true');
      first ??= input;
    }
    first?.focus();
  };

  let index = 0;
  const current = () => flow()[index];

  const render = (dir: 1 | -1 | 0) => {
    const steps = flow();
    const step = steps[index];
    for (const s of STEPS) stepEl(s).toggleAttribute('data-active', s === step);
    count.textContent = msgs.stepOf.replace('{n}', String(index + 1)).replace('{total}', String(steps.length));
    fill.style.transform = `scaleX(${(index + 1) / steps.length})`;
    back.hidden = index === 0;
    next.textContent = index === steps.length - 1 ? msgs.submit : msgs.next;
    if (step === 'variety') syncVarieties();
    if (dir === 0) return;

    const el = stepEl(step);
    // Enter from the side the buyer is heading to; a step back comes from the other side.
    const x = 16 * dir * (rtl ? -1 : 1);
    el.animate(
      reducedMotion.matches
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [{ opacity: 0, transform: `translateX(${x}px)` }, { opacity: 1, transform: 'none' }],
      { duration: reducedMotion.matches ? 150 : 240, easing: EASE_OUT },
    );
    if (form.getBoundingClientRect().top < 0) form.scrollIntoView({ block: 'start', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    el.querySelector<HTMLElement>('.qf__q')?.focus({ preventScroll: true });
  };

  // keepalive lets a step's update finish even if the buyer closes the tab straight after tapping Next.
  const post = (stage: Step | 'submitted', input: QuoteInput) => sendLead(
    (u, init) => fetch(u, { ...init, keepalive: stage !== 'submitted' }), endpoint(),
    leadPayload({ leadId, stage, locale: form.dataset.locale ?? 'en', page: location.href, input, labels: labelsFor(input) }),
  );

  const goNext = async () => {
    if (busy) return;
    const input = read();
    const step = current();
    const errors = validateStep(step, input);
    if (Object.keys(errors).length) { showErrors(errors); return; }
    clearErrors(stepEl(step));
    // Every answered step is saved at once: the contact step is the lead, later steps fill in the same row.
    if (endpoint() && !input.botcheck) void post(step, input);
    if (index < flow().length - 1) { index++; render(1); return; }
    await submit(input);
  };

  const setState = (state: 'success' | 'error') => {
    form.dataset.formState = state;
    form.querySelector<HTMLElement>(`[data-show="${state}"] [data-status-heading]`)?.focus();
  };

  const submit = async (input: QuoteInput) => {
    const result = validateQuote(input, Date.now());
    if (!result.ok) {
      if (result.spam) { setState('success'); return; } // silently drop bots
      const at = flow().indexOf(result.step!);
      if (at >= 0) { index = at; render(-1); }
      showErrors(result.errors);
      return;
    }
    busy = true;
    next.textContent = msgs.sending;
    next.setAttribute('aria-busy', 'true');
    let status: 'ok' | 'error' = 'error';
    if (endpoint()) {
      if (result.waitMs > 0) await new Promise((r) => setTimeout(r, result.waitMs));
      status = await post('submitted', input);
    }
    busy = false;
    next.textContent = msgs.submit;
    next.removeAttribute('aria-busy');
    if (status === 'ok') { setState('success'); return; }
    const labels = labelsFor(input);
    const text = summarizeQuote(input, labels);
    const wa = form.querySelector<HTMLAnchorElement>('[data-fallback="whatsapp"]');
    if (wa && form.dataset.wa) wa.href = `${form.dataset.wa}?text=${encodeURIComponent(text)}`;
    const mail = form.querySelector<HTMLAnchorElement>('[data-fallback="email"]');
    if (mail && form.dataset.mail) mail.href = `${form.dataset.mail}?subject=${encodeURIComponent(`Quote request: ${labels.product}`)}&body=${encodeURIComponent(text)}`;
    setState('error');
  };

  form.addEventListener('submit', (e) => { e.preventDefault(); void goNext(); });
  back.addEventListener('click', () => { if (index > 0 && !busy) { index--; clearErrors(); render(-1); } });

  // Taps on a card advance; arrow keys only move the selection, so keyboard users are never yanked forward.
  form.addEventListener('pointerdown', () => { lastPointer = performance.now(); });
  form.addEventListener('change', (e) => {
    const el = e.target as HTMLInputElement;
    if (el.type !== 'radio') return;
    clearErrors(stepEl(current()));
    if (el.name === 'product') syncVarieties();
    // "Something else" / "Another amount" open a text box instead of moving on
    const other = form.querySelector<HTMLElement>(`[data-other="${el.name}"]`);
    if (other) {
      const open = el.value === 'other';
      other.toggleAttribute('data-open', open);
      if (open) { other.querySelector('input')!.focus(); return; }
    }
    if (performance.now() - lastPointer > 800 || advancing) return;
    advancing = true;
    setTimeout(() => { advancing = false; void goNext(); }, AUTO_ADVANCE_MS);
  });

  form.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement;
    if (el.getAttribute('aria-invalid')) {
      el.removeAttribute('aria-invalid');
      const err = form.querySelector(`#err-${el.name}`);
      if (err) err.textContent = '';
    }
  });

  form.toggleAttribute('data-enhanced', true);
  form.querySelector<HTMLElement>('[data-progress]')!.hidden = false;
  render(0);
}
