import type { APIRoute } from 'astro';
import { aiTxt } from '../../lib/ai-discovery';

export const GET: APIRoute = ({ site }) => aiTxt(site!);
