import type { APIRoute } from 'astro';
import { aiSummary } from '../../lib/ai-discovery';

export const GET: APIRoute = ({ site }) => aiSummary(site!);
