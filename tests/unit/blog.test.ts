import { describe, it, expect } from 'vitest';
import { readingTime, postSlug, postLocale } from '../../src/lib/blog-pure';

describe('blog helpers', () => {
  it('reading time for 440 words is 2', () => expect(readingTime(Array(440).fill('word').join(' '))).toBe(2));
  it('minimum 1 minute', () => expect(readingTime('short')).toBe(1));
  it('counts CJK by characters', () => expect(readingTime('字'.repeat(800))).toBe(2));
  it('splits ids', () => { expect(postSlug('fr/foo-bar')).toBe('foo-bar'); expect(postLocale('fr/foo-bar')).toBe('fr'); });
});
