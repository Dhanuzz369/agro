export type Catalog = { slug: string; varieties: string[] }[];
export type QuoteInput = {
  product: string; variety: string; quantity: string; unit: 'mt' | 'fcl20' | 'fcl40'; country: string; port: string;
  incoterm: 'FOB' | 'CFR' | 'CIF' | 'other'; packing: string; name: string; company: string; email: string;
  whatsapp: string; message: string; botcheck: string; startedAt: number;
};
type ErrorCode = 'required' | 'email' | 'quantity' | 'product';
export type QuoteResult = { ok: true; waitMs: number } | { ok: false; errors: Partial<Record<keyof QuoteInput, ErrorCode>>; spam?: boolean };

export function parsePrefill(search: string, catalog: Catalog): { product?: string; variety?: string } {
  const q = new URLSearchParams(search);
  const product = catalog.find((c) => c.slug === q.get('product'));
  if (!product) return {};
  const variety = q.get('variety');
  return variety && product.varieties.includes(variety) ? { product: product.slug, variety } : { product: product.slug };
}

export function validateQuote(input: QuoteInput, now: number): QuoteResult {
  if (input.botcheck) return { ok: false, errors: {}, spam: true };
  const errors: Partial<Record<keyof QuoteInput, ErrorCode>> = {};
  if (!input.product) errors.product = 'product';
  const qty = Number(input.quantity);
  if (!input.quantity.trim() || !Number.isFinite(qty) || qty <= 0) errors.quantity = 'quantity';
  if (!input.country.trim()) errors.country = 'required';
  if (!input.name.trim()) errors.name = 'required';
  if (!input.email.trim()) errors.email = 'required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.email.trim())) errors.email = 'email';
  // Field errors win; a valid but fast submit is never dropped, the caller waits waitMs before sending.
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, waitMs: Math.max(0, 3000 - (now - input.startedAt)) };
}

export function summarizeQuote(i: QuoteInput, labels: { product: string; variety: string }): string {
  const unit = { mt: 'MT', fcl20: '× 20 ft', fcl40: '× 40 ft' }[i.unit];
  return [
    `Quote request — ${labels.product}${labels.variety ? ` (${labels.variety})` : ''}`,
    `Quantity: ${i.quantity} ${unit}`,
    `Destination: ${i.port ? `${i.port}, ` : ''}${i.country}`,
    `Incoterm: ${i.incoterm}`,
    i.packing && `Packing: ${i.packing}`,
    `Name: ${i.name}${i.company ? `, ${i.company}` : ''}`,
    `Email: ${i.email}`,
    i.whatsapp && `WhatsApp: ${i.whatsapp}`,
    i.message && `Notes: ${i.message}`,
  ].filter(Boolean).join('\n');
}

export async function submitQuote(fetchFn: typeof fetch, accessKey: string, input: QuoteInput, labels: { product: string; variety: string }): Promise<'ok' | 'error'> {
  const { botcheck: _b, startedAt: _s, ...fields } = input;
  try {
    const res = await fetchFn('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `Quote request: ${labels.product}${labels.variety ? ` — ${labels.variety}` : ''} (${input.country})`,
        from_name: 'GoodBiz Agri website',
        ...fields,
        product: labels.product,
        variety: labels.variety,
        summary: summarizeQuote(input, labels),
      }),
    });
    if (!res.ok) return 'error';
    const data = (await res.json()) as { success?: boolean };
    return data.success ? 'ok' : 'error';
  } catch {
    return 'error';
  }
}
