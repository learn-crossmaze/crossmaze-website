// The picture a job is shared with (careers page → "Share this job"): a 1080 × 1350 poster for WhatsApp and
// Instagram, and a 1200 × 630 version that WhatsApp, Facebook and LinkedIn show under the job's link. Both are
// made when the site is built, from the job's details in the admin panel (src/pages/share/jobs/[image].ts), in
// the website's pastel glass look: the logo, "We're hiring", the title, where, three facts, the link and a QR
// code to it. Laid out by satori (flexbox and text in the site's card fonts) and drawn by resvg.
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import QRCode from 'qrcode';
import * as icons from 'lucide-static';
import type { Job } from '../data/jobs';
import { jobFacts, jobUrl, jobWhere } from './jobs';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file));
let fonts: { name: string; data: Buffer; weight: 700 | 800; style: 'normal' }[] | undefined;
const loadFonts = () =>
  (fonts ??= [
    { name: 'Display', data: read('src/careers/fonts/fredoka-700.ttf'), weight: 700, style: 'normal' },
    { name: 'Text', data: read('src/careers/fonts/nunito-700.ttf'), weight: 700, style: 'normal' },
    { name: 'Text', data: read('src/careers/fonts/nunito-800.ttf'), weight: 800, style: 'normal' },
  ]);
let logo: string | undefined;
const loadLogo = () => (logo ??= `data:image/png;base64,${read('public/logo.png').toString('base64')}`);

const svgUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
function icon(name: string, size: number, color: string) {
  const svg = (icons as Record<string, unknown>)[name];
  if (typeof svg !== 'string') throw new Error(`Unknown lucide icon "${name}"`);
  return svgUri(
    svg
      .replace(/width="24"/, `width="${size}"`)
      .replace(/height="24"/, `height="${size}"`)
      .replace(/stroke="currentColor"/, `stroke="${color}"`)
      .replace(/stroke-width="2"/, 'stroke-width="2.2"'),
  );
}

// A tiny element builder for satori (it takes React-like objects).
type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, ...children: unknown[]): Node => ({
  type,
  props: { style: { display: 'flex', ...style }, children: children.flat().filter((c) => c !== false && c != null) },
});
const img = (src: string, width: number, height: number, style: Record<string, unknown> = {}): Node => ({
  type: 'img',
  props: { src, width, height, style },
});
const star = (x: number, y: number, size: number, color: string, turn = 0) =>
  img(
    svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${color}" d="M12 1.5l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 8.8l7.1-.7z"/></svg>`),
    size,
    size,
    { position: 'absolute', left: x, top: y, transform: `rotate(${turn}deg)` },
  );
const glow = (x: number, y: number, size: number, color: string) =>
  h('div', { position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: size, backgroundColor: color });

const INK = '#14307f';
const TEXT = '#1d2b5c';
const MUTED = '#4a5578';
const BACKGROUND = 'linear-gradient(160deg, #ffe9d6 0%, #fde3f1 38%, #e6e4ff 68%, #dff6ec 100%)';
const TITLE = 'linear-gradient(120deg, #14307f 0%, #4b3fb5 55%, #c2387a 100%)';
const BADGES = [
  ['#e3ecff', '#14307f'],
  ['#dff6ea', '#1f7a3c'],
  ['#fff1d1', '#9a6500'],
];

const hiring = (size: number) =>
  h(
    'div',
    {
      alignSelf: 'flex-start',
      alignItems: 'center',
      gap: Math.round(size * 0.35),
      padding: `${Math.round(size * 0.33)}px ${Math.round(size * 0.72)}px`,
      borderRadius: 999,
      backgroundImage: 'linear-gradient(135deg, #ffde75 0%, #ffc93c 50%, #ffb224 100%)',
      color: '#131a3a',
      fontFamily: 'Display',
      fontSize: size,
    },
    img(icon('Sparkles', size, '#131a3a'), size, size),
    'We’re hiring',
  );

/** A title never breaks at its hyphen ("In-Charge"): a word joiner after each one keeps the word whole. */
const unbroken = (title: string) => title.replace(/-/g, '-\u2060');

/** Shrinks a long job title so it stays within about three lines. */
const titleSize = (title: string, base: number) => (title.length > 34 ? base * 0.72 : title.length > 22 ? base * 0.85 : base);

/** The 1080 × 1350 poster. */
async function poster(job: Job) {
  const width = 1080;
  const height = 1350;
  const qr = await QRCode.toString(jobUrl(job), { type: 'svg', margin: 0, color: { dark: INK, light: '#ffffff' } });
  const facts = jobFacts(job);
  const size = titleSize(job.title, 104);
  const tree = h(
    'div',
    { width, height, position: 'relative', backgroundImage: BACKGROUND, fontFamily: 'Text', fontWeight: 700, color: INK },
    glow(-80, -60, 300, 'rgba(255, 201, 60, 0.30)'),
    glow(width - 220, height - 260, 340, 'rgba(127, 211, 160, 0.28)'),
    glow(width - 160, 120, 220, 'rgba(184, 167, 255, 0.32)'),
    star(width - 190, 110, 70, '#ffc93c', 12),
    star(width - 120, 230, 34, '#ff8fa3', -10),
    star(38, height - 150, 46, '#7cc4ff', 8),
    h(
      'div',
      {
        position: 'absolute',
        left: 60,
        top: 64,
        right: 60,
        bottom: 64,
        flexDirection: 'column',
        padding: 64,
        borderRadius: 56,
        backgroundColor: 'rgba(255, 255, 255, 0.74)',
        border: '2px solid rgba(255, 255, 255, 0.92)',
        boxShadow: '0 30px 80px -30px rgba(20, 48, 127, 0.35)',
      },
      img(loadLogo(), 492, 64),
      h('div', { marginTop: 56 }, hiring(36)),
      h(
        'div',
        {
          marginTop: 34,
          fontFamily: 'Display',
          fontSize: size,
          lineHeight: 1.04,
          letterSpacing: -1,
          backgroundImage: TITLE,
          backgroundClip: 'text',
          color: 'transparent',
        },
        unbroken(job.title),
      ),
      h('div', { marginTop: 22, alignItems: 'center', gap: 12, fontSize: 34, color: MUTED }, img(icon('MapPin', 34, '#e2543c'), 34, 34), jobWhere(job)),
      h(
        'div',
        { marginTop: 50, flexDirection: 'column', gap: 22 },
        facts.map((f, i) =>
          h(
            'div',
            { alignItems: 'center', gap: 22, fontSize: 34, lineHeight: 1.25, color: TEXT },
            h(
              'div',
              { width: 72, height: 72, flexShrink: 0, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: BADGES[i][0] },
              img(icon(f.icon, 36, BADGES[i][1]), 36, 36),
            ),
            h('div', { flexDirection: 'column' }, f.text.split('\n').map((line) => h('div', {}, line))),
          ),
        ),
      ),
      h(
        'div',
        { marginTop: 'auto', paddingTop: 30, alignItems: 'center', gap: 36, borderTop: '2px dashed rgba(20, 48, 127, 0.18)' },
        h(
          'div',
          { flex: 1, flexDirection: 'column' },
          h('div', { fontFamily: 'Display', fontSize: 46 }, 'Apply in 2 minutes'),
          h('div', { marginTop: 6, fontSize: 29, color: MUTED }, jobUrl(job).replace(/^https:\/\/(www\.)?/, '')),
        ),
        h('div', { padding: 14, borderRadius: 22, backgroundColor: '#ffffff', boxShadow: '0 10px 30px -16px rgba(20, 48, 127, 0.4)' }, img(svgUri(qr), 162, 162)),
      ),
    ),
  );
  return { tree, width, height };
}

/** The 1200 × 630 picture under the job's link in a chat. */
function linkCard(job: Job) {
  const width = 1200;
  const height = 630;
  // One row of chips: where, the work timings, and the experience when it is short enough to fit beside them.
  const experience = job.experience?.trim() ?? '';
  const chips = [
    { icon: 'MapPin', color: '#e2543c', text: jobWhere(job).replace(/, Bengaluru$/, '') },
    job.timings[0] && { icon: 'Clock', color: '#9a6500', text: job.timings[0].replace(/^[^:]*day:\s*/i, '') },
    experience && experience.length <= 26 && { icon: 'Briefcase', color: '#1f7a3c', text: experience },
  ].filter((c): c is { icon: string; color: string; text: string } => !!c);
  // The words sit in a box inset from the edges (satori measures a padded root box wrongly).
  const tree = h(
    'div',
    { width, height, position: 'relative', backgroundImage: BACKGROUND, fontFamily: 'Text', fontWeight: 800, color: INK },
    glow(940, -80, 340, 'rgba(184, 167, 255, 0.34)'),
    glow(1000, 400, 300, 'rgba(127, 211, 160, 0.28)'),
    star(1050, 70, 90, '#ffc93c', 12),
    h(
      'div',
      { position: 'absolute', left: 64, top: 56, right: 64, bottom: 56, flexDirection: 'column' },
      img(loadLogo(), 431, 56),
      h('div', { marginTop: 40 }, hiring(30)),
      h(
        'div',
        { marginTop: 22, fontFamily: 'Display', fontSize: titleSize(job.title, 92), lineHeight: 1.04, backgroundImage: TITLE, backgroundClip: 'text', color: 'transparent' },
        unbroken(job.title),
      ),
      h(
        'div',
        { marginTop: 'auto', gap: 18, flexWrap: 'wrap' },
        chips.map((c) =>
          h(
            'div',
            { alignItems: 'center', gap: 10, padding: '12px 20px', borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.78)', fontSize: 27, color: TEXT },
            img(icon(c.icon, 28, c.color), 28, 28),
            c.text,
          ),
        ),
      ),
    ),
  );
  return { tree, width, height };
}

async function draw({ tree, width, height }: { tree: Node; width: number; height: number }) {
  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], { width, height, fonts: loadFonts() });
  return new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
}

export const posterPng = async (job: Job) => draw(await poster(job));
export const linkCardPng = (job: Job) => draw(linkCard(job));
