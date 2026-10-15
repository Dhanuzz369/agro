import { describe, it, expect, vi } from 'vitest';
import { parsePrefill, validateQuote, summarizeQuote, submitQuote, type QuoteInput } from '../../src/lib/quote';

const catalog = [{ slug: 'turmeric', varieties: ['powder', 'dried-finger'] }, { slug: 'rice', varieties: ['ponni'] }];
const base: QuoteInput = {
  product: 'turmeric', variety: 'powder', quantity: '20', unit: 'mt', country: 'UAE', port: 'Jebel Ali', incoterm: 'CIF',
  packing: '25 kg bags', name: 'Amal', company: 'Gulf Foods', email: 'amal@gulf.ae', whatsapp: '', message: '', botcheck: '', startedAt: 0,
};

describe('parsePrefill', () => {
  it('reads known product and variety', () => expect(parsePrefill('?product=turmeric&variety=powder', catalog)).toEqual({ product: 'turmeric', variety: 'powder' }));
  it('ignores unknown product', () => expect(parsePrefill('?product=mango&variety=powder', catalog)).toEqual({}));
  it('ignores variety from another product', () => expect(parsePrefill('?product=rice&variety=powder', catalog)).toEqual({ product: 'rice' }));
  it('ignores script injection', () => expect(parsePrefill('?product=%3Cscript%3Ealert(1)%3C/script%3E', catalog)).toEqual({}));
  it('handles empty search', () => expect(parsePrefill('', catalog)).toEqual({}));
});

describe('validateQuote', () => {
  it('accepts a complete request', () => expect(validateQuote(base, 10_000)).toEqual({ ok: true, waitMs: 0 }));
  it('requires product, quantity, country, name, email', () => {
    const r = validateQuote({ ...base, product: '', quantity: '', country: '', name: '', email: '' }, 10_000);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toEqual({ product: 'product', quantity: 'quantity', country: 'required', name: 'required', email: 'required' });
  });
  it('rejects bad email', () => {
    const r = validateQuote({ ...base, email: 'nope' }, 10_000);
    expect(r.ok === false && r.errors.email).toBe('email');
  });
  it('rejects zero or negative quantity', () => {
    for (const q of ['0', '-5', 'abc']) {
      const r = validateQuote({ ...base, quantity: q }, 10_000);
      expect(r.ok === false && r.errors.quantity).toBe('quantity');
    }
  });
  it('flags honeypot as spam', () => {
    const r = validateQuote({ ...base, botcheck: 'x' }, 10_000);
    expect(r.ok === false && r.spam).toBe(true);
  });
  it('never drops a valid fast submission; asks the caller to wait out the 3 s minimum', () => {
    expect(validateQuote({ ...base, startedAt: 9_000 }, 10_000)).toEqual({ ok: true, waitMs: 2000 });
  });
  it('field errors win over the timing check', () => {
    const r = validateQuote({ ...base, email: '', startedAt: 9_900 }, 10_000);
    expect(r.ok === false && r.errors.email).toBe('required');
    expect(r.ok === false && r.spam).toBeUndefined();
  });
});

describe('summarizeQuote', () => {
  it('includes the key fields', () => {
    const s = summarizeQuote(base, { product: 'Turmeric', variety: 'Turmeric powder' });
    for (const part of ['Turmeric', 'Turmeric powder', '20', 'Jebel Ali', 'CIF', 'Gulf Foods', 'amal@gulf.ae']) expect(s).toContain(part);
  });
});

describe('submitQuote', () => {
  const labels = { product: 'Turmeric', variety: 'Turmeric powder' };
  it('returns ok on success', async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    expect(await submitQuote(f as any, 'key', base, labels)).toBe('ok');
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('https://api.web3forms.com/submit');
    expect(JSON.parse(init.body).access_key).toBe('key');
    expect(JSON.parse(init.body).botcheck).toBeUndefined();
  });
  it('returns error on success:false', async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: false }) });
    expect(await submitQuote(f as any, 'key', base, labels)).toBe('error');
  });
  it('returns error on network failure', async () => {
    const f = vi.fn().mockRejectedValue(new Error('offline'));
    expect(await submitQuote(f as any, 'key', base, labels)).toBe('error');
  });
});

describe('submitQuote timeout', () => {
  const labels = { product: 'Turmeric', variety: 'Turmeric powder' };
  it('gives up after 15 s on a request that never settles and aborts it', async () => {
    vi.useFakeTimers();
    try {
      let signal: AbortSignal | undefined;
      const never = vi.fn((_url: string, init: RequestInit) => { signal = init.signal ?? undefined; return new Promise<Response>(() => {}); });
      let settled: string | undefined;
      const p = submitQuote(never as any, 'key', base, labels).then((s) => (settled = s));
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
