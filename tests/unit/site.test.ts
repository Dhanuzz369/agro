import { describe, it, expect } from 'vitest';
import { isPlaceholder, whatsappHref, mailtoHref } from '../../src/lib/site';

describe('site helpers', () => {
  it('detects placeholders', () => { expect(isPlaceholder('REPLACE: x')).toBe(true); expect(isPlaceholder('91987')).toBe(false); });
  it('builds WhatsApp links with digits only', () => expect(whatsappHref('+91 98765-43210', 'Hi there')).toBe('https://wa.me/919876543210?text=Hi%20there'));
  it('returns null for placeholder numbers', () => expect(whatsappHref('REPLACE: 91')).toBeNull());
  it('builds mailto links', () => expect(mailtoHref('a@b.co', 'Quote', 'Body')).toBe('mailto:a@b.co?subject=Quote&body=Body'));
});
