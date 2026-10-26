import { describe, it, expect, vi } from 'vitest';
import { parsePrefill, validateStep, validateQuote, summarizeQuote, leadPayload, sendLead, type QuoteInput } from '../../src/lib/quote';

const catalog = [{ slug: 'turmeric', varieties: ['powder', 'dried-finger'] }, { slug: 'rice', varieties: ['ponni'] }];
const base: QuoteInput = {
  name: 'Amal', company: 'Gulf Foods', email: 'amal@gulf.ae', whatsapp: '',
  product: 'turmeric', variety: 'powder', quantity: 'one', country: 'UAE', port: 'Jebel Ali', incoterm: 'CIF',
  message: '', botcheck: '', startedAt: 0,
};
const labels = { product: 'Turmeric', variety: 'Turmeric powder', quantity: '1 container', incoterm: 'CIF' };

describe('parsePrefill', () => {
  it('reads known product and variety', () => expect(parsePrefill('?product=turmeric&variety=powder', catalog)).toEqual({ product: 'turmeric', variety: 'powder' }));
  it('ignores unknown product', () => expect(parsePrefill('?product=mango&variety=powder', catalog)).toEqual({}));
  it('ignores variety from another product', () => expect(parsePrefill('?product=rice&variety=powder', catalog)).toEqual({ product: 'rice' }));
  it('ignores script injection', () => expect(parsePrefill('?product=%3Cscript%3Ealert(1)%3C/script%3E', catalog)).toEqual({}));
  it('handles empty search', () => expect(parsePrefill('', catalog)).toEqual({}));
});

describe('validateStep', () => {
  it('contact needs a name and either an email or a WhatsApp number', () => {
    expect(validateStep('contact', { ...base, name: '' })).toEqual({ name: 'required' });
    expect(validateStep('contact', { ...base, email: '', whatsapp: '' })).toEqual({ email: 'contact' });
    expect(validateStep('contact', { ...base, email: '', whatsapp: '+971 50 123 4567' })).toEqual({});
    expect(validateStep('contact', base)).toEqual({});
  });
  it('rejects a malformed email even when WhatsApp is given', () => {
    expect(validateStep('contact', { ...base, email: 'nope', whatsapp: '+971501234567' })).toEqual({ email: 'email' });
  });
  it('treats a too-short phone as missing', () => {
    expect(validateStep('contact', { ...base, email: '', whatsapp: '123' })).toEqual({ email: 'contact' });
  });
  it('product, quantity and destination are required; variety, incoterm and notes are not', () => {
    expect(validateStep('product', { ...base, product: '' })).toEqual({ product: 'product' });
    expect(validateStep('quantity', { ...base, quantity: ' ' })).toEqual({ quantity: 'choose' });
    expect(validateStep('destination', { ...base, country: '' })).toEqual({ country: 'required' });
    expect(validateStep('variety', { ...base, variety: '' })).toEqual({});
    expect(validateStep('incoterm', { ...base, incoterm: '' })).toEqual({});
    expect(validateStep('notes', base)).toEqual({});
  });
});

describe('validateQuote', () => {
  it('accepts a complete request', () => expect(validateQuote(base, 10_000)).toEqual({ ok: true, waitMs: 0 }));
  it('points at the first step with a problem', () => {
    const r = validateQuote({ ...base, country: '', product: '' }, 10_000);
    expect(r).toEqual({ ok: false, step: 'product', errors: { product: 'product' } });
  });
  it('flags honeypot as spam', () => {
    const r = validateQuote({ ...base, botcheck: 'x' }, 10_000);
    expect(r.ok === false && r.spam).toBe(true);
  });
  it('never drops a valid fast submission; asks the caller to wait out the 3 s minimum', () => {
    expect(validateQuote({ ...base, startedAt: 9_000 }, 10_000)).toEqual({ ok: true, waitMs: 2000 });
  });
});

describe('summarizeQuote', () => {
  it('includes the key fields', () => {
    const s = summarizeQuote(base, labels);
    for (const part of ['Turmeric', 'Turmeric powder', '1 container', 'Jebel Ali', 'CIF', 'Gulf Foods', 'amal@gulf.ae']) expect(s).toContain(part);
  });
  it('reads sensibly for a lead that only gave contact details', () => {
    const s = summarizeQuote({ ...base, product: '', variety: '', quantity: '', country: '', incoterm: '' }, { product: '', variety: '', quantity: '', incoterm: '' });
    expect(s).toContain('product not chosen yet');
    expect(s).not.toContain('Destination');
  });
});

describe('leadPayload', () => {
  it('carries the lead id and stage, uses readable labels and drops internals', () => {
    const p = leadPayload({ leadId: 'L1', stage: 'contact', locale: 'en', page: 'https://x/contact', input: base, labels }) as any;
    expect(p).toMatchObject({ leadId: 'L1', stage: 'contact', product: 'Turmeric', quantity: '1 container', email: 'amal@gulf.ae' });
    expect(p.botcheck).toBeUndefined();
    expect(p.startedAt).toBeUndefined();
    expect(p.summary).toContain('Turmeric');
  });
});

describe('sendLead', () => {
  const payload = { leadId: 'L1' };
  it('posts JSON as text/plain and returns ok', async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    expect(await sendLead(f as any, 'https://script.google.com/x/exec', payload)).toBe('ok');
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('https://script.google.com/x/exec');
    expect(init.headers['Content-Type']).toMatch(/^text\/plain/);
    expect(JSON.parse(init.body)).toEqual(payload);
  });
  it('returns error on ok:false', async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: false }) });
    expect(await sendLead(f as any, 'u', payload)).toBe('error');
  });
  it('returns error on network failure', async () => {
    const f = vi.fn().mockRejectedValue(new Error('offline'));
    expect(await sendLead(f as any, 'u', payload)).toBe('error');
  });
  it('gives up after 15 s on a request that never settles and aborts it', async () => {
    vi.useFakeTimers();
    try {
      let signal: AbortSignal | undefined;
      const never = vi.fn((_url: string, init: RequestInit) => { signal = init.signal ?? undefined; return new Promise<Response>(() => {}); });
      let settled: string | undefined;
      const p = sendLead(never as any, 'u', payload).then((s) => (settled = s));
      await vi.advanceTimersByTimeAsync(14_999);
      expect(settled).toBeUndefined();
      await vi.advanceTimersByTimeAsync(1);
      await p;
      expect(settled).toBe('error');
      expect(signal?.aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
