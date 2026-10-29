import type { APIRoute } from 'astro';
import { aiService } from '../../lib/ai-discovery';

export const GET: APIRoute = ({ site }) => aiService(site!);
