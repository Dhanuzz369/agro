import { describe, it, expect } from 'vitest';
import { z } from 'astro/zod';
import { readingTime, postSlug, postLocale, isPublished } from '../../src/lib/blog-pure';
import { blogSchema } from '../../src/lib/schemas';

describe('blog helpers', () => {
  it('reading time for 440 words is 2', () => expect(readingTime(Array(440).fill('word').join(' '))).toBe(2));
  it('minimum 1 minute', () => expect(readingTime('short')).toBe(1));
  it('counts CJK by characters', () => expect(readingTime('字'.repeat(800))).toBe(2));
  it('splits ids', () => { expect(postSlug('fr/foo-bar')).toBe('foo-bar'); expect(postLocale('fr/foo-bar')).toBe('fr'); });
});

describe('drafts', () => {
  const base = { title: 't', description: 'd', date: '2026-10-01', author: 'a', category: 'market-updates' };
  const schema = blogSchema(() => z.any());
  it('draft defaults to false', () => expect(schema.parse(base).draft).toBe(false));
  it('accepts draft: true', () => expect(schema.parse({ ...base, draft: true }).draft).toBe(true));
  it('isPublished filters drafts', () => {
    expect(isPublished({ data: { draft: true } })).toBe(false);
    expect(isPublished({ data: { draft: false } })).toBe(true);
  });
});
