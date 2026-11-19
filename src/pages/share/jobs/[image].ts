// The pictures a job is shared with (src/careers/poster.ts): /share/jobs/<slug>.png (the poster) and
// /share/jobs/<slug>-link.png (under the job's link in a chat). Made when the site is built.
import type { APIRoute, GetStaticPaths } from 'astro';
import { jobs, type Job } from '../../../data/jobs';
import { linkCardPng, posterPng } from '../../../careers/poster';

export const getStaticPaths: GetStaticPaths = () =>
  jobs.flatMap((job) => [
    { params: { image: `${job.slug}.png` }, props: { job, kind: 'poster' } },
    { params: { image: `${job.slug}-link.png` }, props: { job, kind: 'link' } },
  ]);

export const GET: APIRoute = async ({ props }) => {
  const { job, kind } = props as { job: Job; kind: 'poster' | 'link' };
  const png = kind === 'poster' ? await posterPng(job) : await linkCardPng(job);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
