import type { APIRoute } from 'astro';
import { getEntitiesByType } from '@/lib/data/entities';

export const GET: APIRoute = async () =>
  new Response(JSON.stringify(getEntitiesByType('project')), {
    headers: { 'Content-Type': 'application/json' },
  });
