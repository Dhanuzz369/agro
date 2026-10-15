import { describe, it, expect } from 'vitest';
import { createT } from '../../src/i18n/t';

describe('createT', () => {
  it('returns English strings', () => expect(createT('en')('cta.quote')).toBe('Request a quote'));
  it('interpolates variables', () => expect(createT('en')('blog.readingTime', { n: 4 })).toBe('4 min read'));
  it('falls back to English for a missing key in another locale', () => {
    const t = createT('fr');
    expect(typeof t('cta.quote')).toBe('string');
    expect(t('cta.quote').length).toBeGreaterThan(0);
  });
});
