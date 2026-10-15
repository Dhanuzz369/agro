import { describe, it, expect } from 'vitest';
import { mergeText } from '../../src/lib/catalog-pure';

describe('mergeText', () => {
  it('prefers localized text', () => expect(mergeText({ a: 1 }, { a: 2 })).toEqual({ text: { a: 2 }, fallback: false }));
  it('falls back to base when localized missing', () => expect(mergeText({ a: 1 }, undefined)).toEqual({ text: { a: 1 }, fallback: true }));
  it('throws when both missing', () => expect(() => mergeText(undefined, undefined)).toThrow());
});
