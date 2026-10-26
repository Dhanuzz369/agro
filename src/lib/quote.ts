export type Catalog = { slug: string; varieties: string[] }[];

/** The steps in the order a buyer sees them. Contact comes first so a buyer who stops later is still a lead. */
export const STEPS = ['contact', 'product', 'variety', 'quantity', 'destination', 'incoterm', 'notes'] as const;
export type Step = (typeof STEPS)[number];

export type QuoteInput = {
  name: string; company: string; email: string; whatsapp: string;
  product: string; variety: string; quantity: string; country: string; port: string;
  incoterm: 'FOB' | 'CFR' | 'CIF' | 'other' | ''; message: string;
  botcheck: string; startedAt: number;
};
type ErrorCode = 'required' | 'email' | 'contact' | 'product' | 'choose';
export type StepErrors = Partial<Record<keyof QuoteInput, ErrorCode>>;

export function parsePrefill(search: string, catalog: Catalog): { product?: string; variety?: string } {
  const q = new URLSearchParams(search);
  const product = catalog.find((c) => c.slug === q.get('product'));
  if (!product) return {};
  const variety = q.get('variety');
  return variety && product.varieties.includes(variety) ? { product: product.slug, variety } : { product: product.slug };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_DIGITS = 7;

/** Errors for one step only; an empty object means the buyer may move on. */
export function validateStep(step: Step, i: QuoteInput): StepErrors {
  const e: StepErrors = {};
  switch (step) {
    case 'contact': {
      if (!i.name.trim()) e.name = 'required';
      const email = i.email.trim();
      const phone = i.whatsapp.replace(/\D/g, '');
      // Either channel is enough: buyers reply on whichever they check first.
      if (email && !EMAIL.test(email)) e.email = 'email';
      else if (!email && phone.length < PHONE_DIGITS) e.email = 'contact';
      break;
    }
    case 'product': if (!i.product) e.product = 'product'; break;
    case 'quantity': if (!i.quantity.trim()) e.quantity = 'choose'; break;
    case 'destination': if (!i.country.trim()) e.country = 'required'; break;
  }
  return e;
}

/** Final check before the request is sent. A valid but fast submit is never dropped: the caller waits waitMs. */
export function validateQuote(i: QuoteInput, now: number):
  | { ok: true; waitMs: number } | { ok: false; step?: Step; errors: StepErrors; spam?: boolean } {
  if (i.botcheck) return { ok: false, errors: {}, spam: true };
  for (const step of STEPS) {
    const errors = validateStep(step, i);
    if (Object.keys(errors).length) return { ok: false, step, errors };
  }
  return { ok: true, waitMs: Math.max(0, 3000 - (now - i.startedAt)) };
}

export type Labels = { product: string; variety: string; quantity: string; incoterm: string };

export function summarizeQuote(i: QuoteInput, l: Labels): string {
  return [
    `Quote request — ${l.product || 'product not chosen yet'}${l.variety ? ` (${l.variety})` : ''}`,
    l.quantity && `Quantity: ${l.quantity}`,
    i.country && `Destination: ${i.port ? `${i.port}, ` : ''}${i.country}`,
    l.incoterm && `Incoterm: ${l.incoterm}`,
    `Name: ${i.name}${i.company ? `, ${i.company}` : ''}`,
    i.email && `Email: ${i.email}`,
    i.whatsapp && `WhatsApp: ${i.whatsapp}`,
    i.message && `Notes: ${i.message}`,
  ].filter(Boolean).join('\n');
}

/** One row per lead: every step re-sends the same leadId so the sheet updates the row instead of adding one. */
export function leadPayload(a: { leadId: string; stage: Step | 'submitted'; locale: string; page: string; input: QuoteInput; labels: Labels }) {
  const { botcheck: _b, startedAt: _s, ...fields } = a.input;
  return {
    leadId: a.leadId, stage: a.stage, locale: a.locale, page: a.page, ...fields,
    product: a.labels.product, variety: a.labels.variety, quantity: a.labels.quantity, incoterm: a.labels.incoterm,
    summary: summarizeQuote(a.input, a.labels),
  };
}

export const SUBMIT_TIMEOUT_MS = 15_000;

/**
 * POST a lead to the Google Apps Script web app. text/plain keeps it a "simple" request (no CORS preflight,
 * which Apps Script cannot answer); the script reads e.postData.contents as JSON.
 */
export async function sendLead(fetchFn: typeof fetch, endpoint: string, payload: object): Promise<'ok' | 'error'> {
  // A hung request must not leave the buyer staring at "Sending…": abort after 15 s and show the fallbacks.
  const ctrl = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { ctrl.abort(); reject(new Error('timeout')); }, SUBMIT_TIMEOUT_MS);
  });
  try {
    const send = async () => {
      const res = await fetchFn(endpoint, {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return 'error' as const;
      const data = (await res.json()) as { ok?: boolean };
      return data.ok ? ('ok' as const) : ('error' as const);
    };
    return await Promise.race([send(), timedOut]);
  } catch {
    return 'error';
  } finally {
    clearTimeout(timer);
  }
}
