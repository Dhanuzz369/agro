import { describe, it, expect } from 'vitest';
import { monthLabels, seasonRange } from '../../src/lib/months';

describe('months', () => {
  it('returns 12 labels', () => expect(monthLabels('en')).toHaveLength(12));
  it('formats a simple range', () => expect(seasonRange([1, 2, 3, 4], 'en')).toBe('Jan – Apr'));
  it('formats a range that wraps the year', () => expect(seasonRange([11, 12, 1, 2, 3], 'en')).toBe('Nov – Mar'));
  it('formats all-year', () => expect(seasonRange([1,2,3,4,5,6,7,8,9,10,11,12], 'en')).toBe('Jan – Dec'));
  it('bridges a short gap and starts after the largest one', () => expect(seasonRange([3, 4, 10, 11, 12], 'en')).toBe('Oct – Apr'));
});
