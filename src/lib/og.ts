import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';

const font = (pkg: string, file: string) => readFileSync(`node_modules/@fontsource/${pkg}/files/${file}`);
const fonts = [
  { name: 'Fraunces', data: font('fraunces', 'fraunces-latin-500-normal.woff'), weight: 500 as const, style: 'normal' as const },
  { name: 'Manrope', data: font('manrope', 'manrope-latin-500-normal.woff'), weight: 500 as const, style: 'normal' as const },
];

export async function renderOg(o: { eyebrow: string; title: string; subtitle?: string }): Promise<Buffer> {
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: { width: 1200, height: 630, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: '#1F3D2B', color: '#F6F1E7', fontFamily: 'Manrope' },
        children: [
          { type: 'div', props: { style: { fontSize: 28, color: '#E9C46A', letterSpacing: 2 }, children: o.eyebrow.toUpperCase() } },
          { type: 'div', props: { style: { fontFamily: 'Fraunces', fontSize: 76, lineHeight: 1.05, maxWidth: 980 }, children: o.title } },
          { type: 'div', props: { style: { display: 'flex', justifyContent: 'space-between', fontSize: 28 }, children: [
            { type: 'span', props: { children: o.subtitle ?? '' } },
            { type: 'span', props: { style: { color: '#D99A1E' }, children: 'GoodBiz Agri' } },
          ] } },
        ],
      },
    } as never,
    { width: 1200, height: 630, fonts },
  );
  return new Resvg(svg).render().asPng();
}
