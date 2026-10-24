import type { APIRoute } from 'astro';
import { llmsText } from '../lib/llms';

export const GET: APIRoute = async ({ site }) =>
  new Response(await llmsText(site!, true), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
