import type { APIRoute } from 'astro';
import { aiFaq } from '../../lib/ai-discovery';

export const GET: APIRoute = ({ site }) => aiFaq(site!);
