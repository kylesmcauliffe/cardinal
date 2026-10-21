import type { APIRoute } from 'astro';
import { searchRecords } from '../lib/load';

export const prerender = true;

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(searchRecords()), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
