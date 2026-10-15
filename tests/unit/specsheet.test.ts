import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { buildSpecSheet, wrapLines } from '../../src/lib/specsheet';

describe('buildSpecSheet', () => {
  it('produces a one-page PDF with metadata', async () => {
    const bytes = await buildSpecSheet({
      productName: 'Turmeric', varietyName: 'Turmeric powder', hsn: '09103030', region: 'Erode, Tamil Nadu', market: 'Erode Regulated Market',
      specs: [{ label: 'Curcumin', value: '2–5%' }, { label: 'Moisture', value: '≤ 10%' }], packing: ['25 kg paper bags'], moq: '1 × 20 ft FCL',
      ports: 'Chennai Port', contact: 'export@example.com', url: 'https://goodbizagri.com/products/turmeric',
    });
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
    expect(doc.getTitle()).toBe('Turmeric powder — GoodBiz Agri spec sheet');
  });
});

describe('wrapLines', () => {
  const measure = (t: string) => t.length * 6; // 6 units per character
  it('keeps short values on one line', () => expect(wrapLines('25 kg bags', measure, 320)).toEqual(['25 kg bags']));
  it('breaks long values at spaces so each line fits the column', () => {
    const lines = wrapLines('25 kg PP bags, 50 kg jute bags, 1 MT jumbo bags, private label on request for FCL orders', measure, 120);
    expect(lines.length).toBeGreaterThan(1);
    for (const l of lines) expect(measure(l)).toBeLessThanOrEqual(120);
    expect(lines.join(' ')).toBe('25 kg PP bags, 50 kg jute bags, 1 MT jumbo bags, private label on request for FCL orders');
  });
});
