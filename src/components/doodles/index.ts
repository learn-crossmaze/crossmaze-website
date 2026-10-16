// The doodles of every theme, as small SVG files (built by src/pages/doodles/[name].svg.ts) and the CSS
// variables that pick the current theme's set, by day or at night: --doodle-home-1…4 and
// --doodle-page-1…3 for the banners (FloatingShapes.astro), --doodle-section-1…6 for the sections
// (global.css) and --underline-shape for the home page title. BaseLayout puts doodleCss in every page.
// Browsers download the files the current theme and mode show; --doodle-other (banners) and
// --doodle-other-sections list the other mode's files, which the light/dark button fetches ahead of
// time (Header.astro).
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

const slots = (set: ThemeDoodles): [string, Doodle][] => [
  ...set.home.map((d, i): [string, Doodle] => [`home-${i + 1}`, d]),
  ...set.page.map((d, i): [string, Doodle] => [`page-${i + 1}`, d]),
  ...set.sections.map((d, i): [string, Doodle] => [`section-${i + 1}`, d]),
];

const svg = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${inner}</svg>`;
/** A file's name comes from its drawing, so a changed doodle gets a new address (they're cached for a year). */
const nameOf = (file: string) => createHash('sha256').update(file).digest('hex').slice(0, 10);

/** Every theme's slots by day and at night, with the file each one is drawn from. */
const placed = themes.flatMap(({ id }) =>
  slots(themeDoodles[id]).flatMap(([slot, doodle]) =>
    (['day', 'night'] as const).map((mode) => {
      const file = svg(doodle[mode]);
      return { theme: id, slot, mode, file, name: nameOf(file) };
    }),
  ),
);

/** SVG files by name, for src/pages/doodles/[name].svg.ts. */
export const doodleFiles = new Map<string, string>();
for (const { name, file } of placed) {
  if (doodleFiles.has(name) && doodleFiles.get(name) !== file) throw new Error(`Two doodles share the file name ${name}`);
  doodleFiles.set(name, file);
}

const underline = (path: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 12' preserveAspectRatio='none'><path d='${path}' fill='none' stroke='#000' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/></svg>`,
  )}")`;

// Pastel Glass is the default, on :root; every other theme sets all of its doodles by day and at night.
export const doodleCss = themes
  .map(({ id }) => {
    const root = id === 'pastel' ? ':root' : `:root[data-theme='${id}']`;
    const of = (mode: 'day' | 'night') => placed.filter((p) => p.theme === id && p.mode === mode);
    const names = (list: typeof placed) => [...new Set(list.map((p) => p.name))].join(' ');
    const block = (mode: 'day' | 'night', other: 'day' | 'night') => [
      ...of(mode).map((p) => `--doodle-${p.slot}:url(/doodles/${p.name}.svg)`),
      `--doodle-other:'${names(of(other).filter((p) => !p.slot.startsWith('section')))}'`,
      `--doodle-other-sections:'${names(of(other).filter((p) => p.slot.startsWith('section')))}'`,
    ];
    return (
      `${root}{${[...block('day', 'night'), `--underline-shape:${underline(themeDoodles[id].underline)}`].join(';')}}\n` +
      `${root}[data-mode='dark']{${block('night', 'day').join(';')}}`
    );
  })
  .join('\n');
