import { z } from 'astro/zod';
import { isValidHsn } from './hsn';
import { placeIds } from '../data/places';

export const specKeys = [
  'moisture', 'admixture', 'broken', 'foreignMatter', 'damaged', 'grainLength', 'chalky',
  'curcumin', 'count', 'size', 'colour', 'purity', 'oil', 'ash', 'sucrose', 'insoluble',
  'volatileOil', 'fibre', 'aflatoxin', 'mesh', 'sulphur', 'ec', 'ph', 'expansion',
] as const;

const hsnCode = z.string().refine(isValidHsn, 'HSN must be 4–8 digits, no spaces');
const month = z.number().int().min(1).max(12);
type ImageFn = () => z.ZodTypeAny;

export const productSchema = (image: ImageFn) =>
  z
    .object({
      order: z.number().int(),
      // When the page's facts (specs, packing, loads) were last changed: shown on the page, in schema and in the sitemap.
      updated: z.coerce.date(),
      hsn: z.array(z.object({ code: hsnCode, verified: z.boolean() })).min(1),
      heroImage: z.object({ src: image(), isStock: z.boolean() }),
      regions: z.array(z.enum(placeIds)).min(1),
      // Named market towns; empty for products bought from several suppliers across whole states
      markets: z.array(z.string()),
      harvestMonths: z.array(month).min(1).optional(),
      shelfLife: z.string(),
      packing: z.array(z.string()).min(1),
      containerLoad: z.object({ ft20: z.string(), ft40: z.string() }),
      related: z.array(z.string()).max(3),
      varieties: z
        .array(
          z.object({
            id: z.string().regex(/^[a-z0-9-]+$/),
            hsn: hsnCode,
            image: z.object({ src: image(), isStock: z.boolean() }),
            region: z.enum(placeIds).optional(),
            market: z.string().optional(),
            specs: z.array(z.object({ key: z.enum(specKeys), value: z.string() })).min(2),
            packing: z.array(z.string()).min(1),
          }),
        )
        .min(1),
    })
    .superRefine((p, ctx) => {
      const codes = new Set(p.hsn.map((h) => h.code));
      p.varieties.forEach((v, i) => {
        if (!codes.has(v.hsn)) ctx.addIssue({ code: 'custom', path: ['varieties', i, 'hsn'], message: `variety HSN ${v.hsn} not in product hsn[]` });
      });
    });

export const faqSchema = z.array(z.object({ q: z.string(), a: z.string() }));

export const productTextSchema = z.object({
  reviewStatus: z.enum(['pending', 'reviewed']),
  name: z.string(),
  summary: z.string(),
  originLine: z.string(),
  sourcingStory: z.string(),
  varieties: z.record(z.string(), z.object({ name: z.string(), description: z.string() })),
  faq: faqSchema.min(1),
  // Search snippet text for the product page: title (brand is appended), H1, meta description and meta keywords.
  seo: z.object({ title: z.string().max(45), h1: z.string(), description: z.string(), keywords: z.array(z.string()).min(4).max(10) }),
});

export const blogSchema = (image: ImageFn) =>
  z.object({
    title: z.string(),
    description: z.string().max(170),
    date: z.coerce.date(),
    author: z.string(),
    category: z.enum(['market-updates', 'buyer-guides', 'product-knowledge', 'export-process']),
    products: z.array(z.string()).default([]),
    cover: z.object({ src: image(), isStock: z.boolean() }).optional(),
    translationOf: z.string().optional(),
    draft: z.boolean().default(false),
  });

export const siteSchema = z.object({
  name: z.string(),
  legalName: z.string(),
  foundingCity: z.string(),
  address: z.object({ street: z.string(), city: z.string(), region: z.string(), postalCode: z.string(), country: z.literal('IN') }),
  email: z.string(),
  phone: z.string(),
  whatsapp: z.string(),
  leadEndpoint: z.string(),
  registrations: z.array(z.object({
    id: z.enum(['apeda', 'fssai', 'spices-board', 'fieo', 'iec', 'cdb']),
    name: z.string(),
    number: z.string(),
    logo: z.string().startsWith('/logos/').optional(),
    held: z.boolean(),
  })),
  stats: z.object({ countries: z.number(), products: z.number(), markets: z.number() }),
  social: z.array(z.string().url()).default([]),
});

export type ProductData = z.infer<ReturnType<typeof productSchema>>;
export type ProductText = z.infer<typeof productTextSchema>;
export type SiteData = z.infer<typeof siteSchema>;
