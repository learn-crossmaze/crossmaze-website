// The doodles of every theme, as small SVG files (built by src/pages/doodles/[name].svg.ts) and the CSS
// variables that pick the current theme's set, by day or at night: --doodle-home-1…4 and
// --doodle-page-1…3 for the banners (FloatingShapes.astro), --doodle-section-1…6 for the sections
// (global.css) and --underline-shape for the home page title. BaseLayout puts doodleCss in every page.
// Browsers only download the files the current theme and mode use.
import { createHash } from 'node:crypto';
import { themes, type ThemeId } from '../../data/themes';
import { calmDoodles } from './calm';
import { candyDoodles } from './candy';
import { crayonDoodles } from './crayon';
import { meadowDoodles } from './meadow';
import { oceanDoodles } from './ocean';
import { pastelDoodles } from './pastel';
import { type Doodle, type ThemeDoodles } from './shared';
import { tropicalDoodles } from './tropical';

export const themeDoodles: Record<ThemeId, ThemeDoodles> = {
  pastel: pastelDoodles,
  meadow: meadowDoodles,
  ocean: oceanDoodles,
  crayon: crayonDoodles,
  calm: calmDoodles,
  candy: candyDoodles,
  tropical: tropicalDoodles,
};

const svg = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${inner}</svg>`;

/** SVG files by name. The name comes from the drawing, so a changed doodle gets a new address. */
export const doodleFiles = new Map<string, string>();

const fileFor = (inner: string) => {
  const file = svg(inner);
  const name = createHash('sha256').update(file).digest('hex').slice(0, 10);
  doodleFiles.set(name, file);
  return `url(/doodles/${name}.svg)`;
};

const slots = (set: ThemeDoodles): [string, Doodle][] => [
  ...set.home.map((d, i): [string, Doodle] => [`home-${i + 1}`, d]),
  ...set.page.map((d, i): [string, Doodle] => [`page-${i + 1}`, d]),
  ...set.sections.map((d, i): [string, Doodle] => [`section-${i + 1}`, d]),
];

const underline = (path: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 12' preserveAspectRatio='none'><path d='${path}' fill='none' stroke='#000' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/></svg>`,
  )}")`;

// Pastel Glass is the default, on :root; every other theme sets all of its doodles by day and at night.
export const doodleCss = themes
  .map(({ id }) => {
    const set = themeDoodles[id];
    const root = id === 'pastel' ? ':root' : `:root[data-theme='${id}']`;
    const vars = (mode: keyof Doodle) => slots(set).map(([slot, d]) => `--doodle-${slot}:${fileFor(d[mode])}`);
    return (
      `${root}{${[...vars('day'), `--underline-shape:${underline(set.underline)}`].join(';')}}\n` +
      `${root}[data-mode='dark']{${vars('night').join(';')}}`
    );
  })
  .join('\n');
