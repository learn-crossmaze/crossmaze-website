// The theme doodles as small SVG files, /doodles/<name>.svg (see src/components/doodles/index.ts).
import type { APIRoute } from 'astro';
import { doodleFiles } from '../../components/doodles';

export function getStaticPaths() {
  return [...doodleFiles.keys()].map((name) => ({ params: { name } }));
}

export const GET: APIRoute = ({ params }) =>
  new Response(doodleFiles.get(params.name ?? ''), { headers: { 'Content-Type': 'image/svg+xml' } });
