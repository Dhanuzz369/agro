import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { parse as parseYaml } from 'yaml';
import { productSchema, productTextSchema, blogSchema, siteSchema } from './lib/schemas';

export const collections = {
  products: defineCollection({ loader: glob({ pattern: '*.yaml', base: './src/content/products' }), schema: ({ image }) => productSchema(image) }),
  productsI18n: defineCollection({ loader: glob({ pattern: '**/*.yaml', base: './src/content/products-i18n' }), schema: productTextSchema }),
  blog: defineCollection({ loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }), schema: ({ image }) => blogSchema(image) }),
  site: defineCollection({ loader: file('./src/content/site.yaml', { parser: (text) => [{ id: 'site', ...parseYaml(text) }] }), schema: siteSchema }),
};
