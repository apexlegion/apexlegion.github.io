import type { APIRoute } from 'astro';
import { getSearchIndexItems } from '@/lib/data/entities';

export const GET: APIRoute = async () =>
  new Response(JSON.stringify(getSearchIndexItems()), {
    headers: { 'Content-Type': 'application/json' },
  });
