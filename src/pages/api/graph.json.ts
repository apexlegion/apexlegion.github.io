import type { APIRoute } from 'astro';
import { getAllNodes, getAllRelations } from '@/lib/data/entities';

export const GET: APIRoute = async () =>
  new Response(JSON.stringify({ nodes: getAllNodes(), relations: getAllRelations() }), {
    headers: { 'Content-Type': 'application/json' },
  });
