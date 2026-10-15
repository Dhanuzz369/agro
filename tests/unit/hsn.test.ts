import { describe, it, expect } from 'vitest';
import { isValidHsn, formatHsn } from '../../src/lib/hsn';

describe('isValidHsn', () => {
  it('accepts 4–8 digit codes', () => {
    for (const c of ['1006', '80280', '100640', '8011220', '09103030']) expect(isValidHsn(c)).toBe(true);
  });
  it('rejects bad codes', () => {
    for (const c of ['', '100', '123456789', '0910 30', '09A03030']) expect(isValidHsn(c)).toBe(false);
  });
});

describe('formatHsn', () => {
  it('groups 8-digit codes 4-2-2', () => expect(formatHsn('09103030')).toBe('0910 30 30'));
  it('groups 6-digit codes 4-2', () => expect(formatHsn('100640')).toBe('1006 40'));
  it('leaves 4, 5 and 7 digit codes as stored', () => {
    expect(formatHsn('1006')).toBe('1006');
    expect(formatHsn('80280')).toBe('80280');
    expect(formatHsn('8011220')).toBe('8011220');
  });
});
