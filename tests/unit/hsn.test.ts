import { describe, it, expect } from 'vitest';
import { isValidHsn } from '../../src/lib/hsn';

describe('isValidHsn', () => {
  it('accepts 4–8 digit codes', () => {
    for (const c of ['1006', '80280', '100640', '8011220', '09103030']) expect(isValidHsn(c)).toBe(true);
  });
  it('rejects bad codes', () => {
    for (const c of ['', '100', '123456789', '0910 30', '09A03030']) expect(isValidHsn(c)).toBe(false);
  });
});
