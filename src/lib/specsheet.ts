import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { isPlaceholder } from './site';

const forest = rgb(0x1f / 255, 0x3d / 255, 0x2b / 255);
const ink = rgb(0x1a / 255, 0x1a / 255, 0x17 / 255);
const muted = rgb(0x4a / 255, 0x47 / 255, 0x40 / 255);
// StandardFonts are WinAnsi-only; normalise characters they cannot encode.
const safe = (s: string) => s.replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/[–—]/g, '-').replace(/×/g, 'x').replace(/·/g, '|').replace(/[^\x20-\x7E\xA0-\xFF]/g, '');

/** Greedy word wrap so each line measures at most maxWidth (a single over-long word keeps its own line). */
export function wrapLines(text: string, measure: (t: string) => number, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next) > maxWidth) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

/** HSN as stored; unverified codes carry the same caveat as the website. */
export const hsnLine = (hsn: string, verified: boolean) => `HSN ${hsn}${verified ? '' : ' (code under verification)'}`;

/** Contact line: the owner's email, or the contact page on the configured site until the email is set. */
export function contactFallback(email: string, site: URL): string {
  if (!isPlaceholder(email)) return email;
  const u = new URL('/contact', site);
  return `${u.host}${u.pathname}`;
}

export async function buildSpecSheet(a: {
  productName: string; varietyName: string; hsn: string; verified: boolean; region: string; market: string;
  specs: { label: string; value: string }[]; packing: string[]; moq: string; ports: string; contact: string; url: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${a.varietyName} — GoodBiz Agri spec sheet`);
  doc.setAuthor('GoodBiz Agri');
  doc.setSubject(`${a.productName} specification, ${hsnLine(a.hsn, a.verified)}`);
  const page = doc.addPage([595.28, 841.89]);
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);
  let y = 780;
  const x = 56;

  page.drawRectangle({ x: 0, y: 800, width: 595.28, height: 42, color: forest });
  page.drawText('GoodBiz Agri', { x, y: 815, size: 16, font: serif, color: rgb(0.96, 0.95, 0.91) });
  page.drawText('Specification sheet', { x: 420, y: 817, size: 10, font: sans, color: rgb(0.91, 0.77, 0.42) });

  page.drawText(safe(a.productName.toUpperCase()), { x, y: (y -= 20), size: 9, font: bold, color: muted });
  page.drawText(safe(a.varietyName), { x, y: (y -= 28), size: 24, font: serif, color: ink });
  page.drawText(hsnLine(a.hsn, a.verified), { x, y: (y -= 22), size: 11, font: mono, color: forest });

  const lineHeight = 13;
  const row = (label: string, value: string) => {
    y -= 22;
    page.drawText(safe(label), { x, y, size: 10, font: sans, color: muted });
    const lines = wrapLines(safe(value), (t) => mono.widthOfTextAtSize(t, 10), 319);
    lines.forEach((l, i) => page.drawText(l, { x: 220, y: y - i * lineHeight, size: 10, font: mono, color: ink }));
    // advance past the wrapped lines so the hairline sits under the last one
    y -= (lines.length - 1) * lineHeight;
    page.drawLine({ start: { x, y: y - 7 }, end: { x: 539, y: y - 7 }, thickness: 0.4, color: rgb(0.85, 0.83, 0.78) });
  };

  y -= 18;
  page.drawText('Origin', { x, y: (y -= 14), size: 12, font: bold, color: ink });
  row('Region', a.region);
  row('Market', a.market);
  y -= 14;
  page.drawText('Specifications', { x, y: (y -= 14), size: 12, font: bold, color: ink });
  for (const s of a.specs) row(s.label, s.value);
  y -= 14;
  page.drawText('Commercial', { x, y: (y -= 14), size: 12, font: bold, color: ink });
  row('Packing', a.packing.join(', '));
  row('Minimum order', a.moq);
  row('Loading ports', a.ports);
  row('Incoterms', 'FOB, CFR, CIF');

  page.drawText('Specifications are typical values; final specification is agreed per contract.', { x, y: 90, size: 8, font: sans, color: muted });
  page.drawText(safe(`${a.contact}   ${a.url}`), { x, y: 72, size: 9, font: sans, color: forest });
  return doc.save();
}
