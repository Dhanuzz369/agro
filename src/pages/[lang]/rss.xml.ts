import type { APIContext } from 'astro';
import { feed } from '../rss.xml';
import { localeStaticPaths } from '../../lib/routes';
import type { Locale } from '../../i18n/config';
export const getStaticPaths = localeStaticPaths;
export const GET = (context: APIContext) => feed(context.params.lang as Locale, context);
