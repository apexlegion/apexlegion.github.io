import type { APIRoute } from 'astro';

const API_INDEX = {
  name: 'AI Atlas API',
  version: '0.3.0',
  endpoints: [
    { path: '/api/projects.json', description: 'All project entities' },
    { path: '/api/models.json', description: 'All model entities' },
    { path: '/api/concepts.json', description: 'All concept entities' },
    { path: '/api/tutorials.json', description: 'All tutorial entities' },
    { path: '/api/graph.json', description: 'Knowledge graph nodes and relations' },
    { path: '/api/search.json', description: 'Search index items' },
  ],
};

export const GET: APIRoute = async () =>
  new Response(JSON.stringify(API_INDEX), {
    headers: { 'Content-Type': 'application/json' },
  });
