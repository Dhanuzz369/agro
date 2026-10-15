import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { buildSpecSheet } from '../../src/lib/specsheet';

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
