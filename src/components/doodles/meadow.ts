// Sunny Meadow: a little garden of flowers and friendly bugs (caterpillar, sunflower, tulip,
// butterfly, daisy, bumblebee, snail, sprout, ladybird, watering can). Butter, peach and leaf-green
// pastels by day; at night, clearer mid-tones that glow softly on the dark olive-and-forest page
// (dimmed pastels would turn khaki there). The section margins alternate warm and cool doodles,
// because warm colours at the margin's 60% night opacity drift towards olive and brown.
import { type Doodle, type ThemeDoodles } from './shared';

type Tone = 'butter' | 'peach' | 'leaf' | 'poppy' | 'sky';

/** Main colour, a shade for details, and a deep shade for faces, spots and stripes. */
type Paints = [string, string, string];

/** Pastel enough to sit quietly behind text. */
const day = {
  butter: ['#ffe59a', '#ffd36b', '#dd9f1c'],
  peach: ['#ffd3b6', '#ffb995', '#e08657'],
  leaf: ['#c9e9b3', '#a9d98f', '#6aa553'],
  poppy: ['#ffc0b3', '#ffa190', '#ec8a78'],
  sky: ['#c4e3f6', '#a3d0ec', '#5d9fcb'],
} satisfies Record<Tone, Paints>;

/**
 * The night versions: more colour and less light, so they glow on the dark meadow. Butter and peach
 * stay light, so they don't turn khaki and brown when dimmed; the deep greens and blues stay light
 * enough for thin legs and antennae to show on the dark page.
 */
const night = {
  butter: ['#ffdb66', '#f2bf3a', '#8c5c00'],
  peach: ['#ffb787', '#f99a64', '#8a3c12'],
  leaf: ['#86d872', '#62c152', '#317a26'],
  poppy: ['#ff8670', '#ec6650', '#9a2f1f'],
  sky: ['#6cbdea', '#4a9fd4', '#2a74a8'],
} satisfies Record<Tone, Paints>;

/** What a drawing paints with: its own colours, the other tones of the same time of day, and a soft highlight. */
interface Paint {
  main: string;
  shade: string;
  deep: string;
  /** Another tone's colour: 0 main, 1 shade, 2 deep. */
  other: (tone: Tone, i?: 0 | 1 | 2) => string;
  /** Highlights: white by day, a soft cream tint at night (pure white glares on the dark page). */
  hi: string;
}

const paint = (tone: Tone, atNight: boolean): Paint => {
  const set = atNight ? night : day;
  const [main, shade, deep] = set[tone];
  return { main, shade, deep, other: (t, i = 0) => set[t][i], hi: atNight ? '#e9f0d6' : '#fff' };
};

/** A doodle in one tone, by day and at night. */
const make = (draw: (p: Paint) => string, tone: Tone): Doodle => ({ day: draw(paint(tone, false)), night: draw(paint(tone, true)) });

/** The point `r` from (cx, cy) at `deg` degrees (0 = right, clockwise), rounded to 1 decimal. */
const at = (r: number, deg: number, cx = 50, cy = 50) => {
  const a = (deg * Math.PI) / 180;
  return [+(cx + r * Math.cos(a)).toFixed(1), +(cy + r * Math.sin(a)).toFixed(1)];
};

/** `count` angles evenly round a circle, starting at `start` degrees. */
const around = (count: number, start: number) => Array.from({ length: count }, (_, i) => start + (i * 360) / count);

/** Petals as fat round-capped strokes from `from` to `to` out from the middle. */
const petals = (count: number, start: number, from: number, to: number) =>
  around(count, start)
    .map((deg) => `M${at(from, deg).join(' ')}L${at(to, deg).join(' ')}`)
    .join('');

/** `count` circles of radius `size`, `r` from (cx, cy), the first straight up. */
const ring = (count: number, r: number, size: number, cx = 50, cy = 50) =>
  around(count, -90)
    .map((deg) => {
      const [x, y] = at(r, deg, cx, cy);
      return `<circle cx="${x}" cy="${y}" r="${size}"/>`;
    })
    .join('');

/** A smiling green caterpillar inching along: wide and low, like a cloud. */
const caterpillar = ({ main, shade, deep, other, hi }: Paint) =>
  [
    [18, 63, 10],
    [31, 58, 12],
    [46, 56, 13],
    [61, 58, 13],
  ]
    .map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 2 ? main : shade}"/><ellipse cx="${x - 3}" cy="${y - 5}" rx="3.5" ry="2.5" fill="${hi}" fill-opacity=".5"/>`)
    .join('') +
  `<path d="M18 71v4M31 68v5M46 67v5M61 69v5M72 33l-5-11M82 32l5-11" stroke="${deep}" stroke-width="3" stroke-linecap="round"/>` +
  `<circle cx="67" cy="21" r="3.5" fill="${deep}"/><circle cx="87" cy="20" r="3.5" fill="${deep}"/>` +
  `<circle cx="77" cy="46" r="15" fill="${main}"/><ellipse cx="71" cy="38" rx="4" ry="2.5" fill="${hi}" fill-opacity=".5"/>` +
  `<circle cx="72" cy="44" r="2.4" fill="${deep}"/><circle cx="82" cy="44" r="2.4" fill="${deep}"/>` +
  `<path d="M72 50q5 4.5 10 0" fill="none" stroke="${deep}" stroke-width="2.5" stroke-linecap="round"/>` +
  `<circle cx="67" cy="50" r="3" fill="${other('peach', 1)}"/><circle cx="87" cy="50" r="3" fill="${other('peach', 1)}"/>`;

/** A smiling sunflower: two rings of round petals around a peachy middle. */
const sunflower = ({ main, shade, other }: Paint) =>
  `<path d="${petals(12, 15, 24, 35)}" stroke="${shade}" stroke-width="13" stroke-linecap="round"/>` +
  `<path d="${petals(12, 0, 24, 35)}" stroke="${main}" stroke-width="13" stroke-linecap="round"/>` +
  `<circle cx="50" cy="50" r="21" fill="${other('peach', 1)}"/>` +
  `<circle cx="43" cy="46" r="2.8" fill="${other('peach', 2)}"/><circle cx="57" cy="46" r="2.8" fill="${other('peach', 2)}"/>` +
  `<path d="M42 54q8 7 16 0" fill="none" stroke="${other('peach', 2)}" stroke-width="3" stroke-linecap="round"/>`;

/** A tulip on its stem with two leaves: tall and narrow, like a balloon. */
const tulip = ({ main, shade, other, hi }: Paint) =>
  `<path d="M50 62v31" stroke="${other('leaf', 1)}" stroke-width="5" stroke-linecap="round"/>` +
  `<path d="M50 90c-3-12-12-19-23-20 2 11 11 18 23 20zM50 84c3-11 12-17 23-18-2 11-11 17-23 18z" fill="${other('leaf')}"/>` +
  `<path d="M29 20l11 11 10-15 10 15 11-11v24a21 21 0 0 1-42 0z" fill="${main}" stroke="${main}" stroke-width="3" stroke-linejoin="round"/>` +
  `<path d="M40 31l10-15 10 15c0 17-4 29-10 34-6-5-10-17-10-34z" fill="${shade}"/>` +
  `<ellipse cx="35" cy="42" rx="3.5" ry="7" fill="${hi}" fill-opacity=".5"/>`;

/** A butterfly, tilted as if fluttering past (and nudged down so the tilted wing keeps clear of the top edge). */
const butterfly = ({ main, shade, deep, hi }: Paint) =>
  `<g transform="translate(0 2) rotate(-10 50 50)">` +
  `<path d="M47 46C38 20 12 12 12 32c0 14 18 22 35 20zM53 46c9-26 35-34 35-14 0 14-18 22-35 20z" fill="${main}"/>` +
  `<path d="M47 55c-15-2-31 9-25 23 6 12 22 0 25-18zM53 55c15-2 31 9 25 23-6 12-22 0-25-18z" fill="${shade}"/>` +
  `<g fill="${hi}" fill-opacity=".55"><circle cx="26" cy="31" r="5.5"/><circle cx="74" cy="31" r="5.5"/><circle cx="31" cy="70" r="3.5"/><circle cx="69" cy="70" r="3.5"/></g>` +
  `<path d="M48 27c-3-9-8-13-13-14M52 27c3-9 8-13 13-14" fill="none" stroke="${deep}" stroke-width="2.5" stroke-linecap="round"/>` +
  `<path d="M50 38v34" stroke="${deep}" stroke-width="7" stroke-linecap="round"/>` +
  `<circle cx="50" cy="31" r="5.5" fill="${deep}"/><circle cx="35" cy="13" r="3" fill="${deep}"/><circle cx="65" cy="13" r="3" fill="${deep}"/></g>`;

/** A round flower, bold enough to read while it spins at 32px: six two-tone petals round a butter middle. */
const daisy = ({ main, shade, other }: Paint) =>
  `<g fill="${shade}">${ring(6, 26, 15.5)}</g><g fill="${main}">${ring(6, 24, 11)}</g><circle cx="50" cy="50" r="15" fill="${other('butter')}"/>`;

/** A striped bumblebee buzzing along a dotted trail. */
const bee = ({ main, shade, deep, other, hi }: Paint) =>
  `<path d="M6 82c8-9 14 5 21-4" fill="none" stroke="${shade}" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 7"/>` +
  `<ellipse cx="44" cy="36" rx="10" ry="15" transform="rotate(-25 44 36)" fill="${other('sky')}"/>` +
  `<ellipse cx="61" cy="33" rx="10" ry="15" transform="rotate(20 61 33)" fill="${other('sky')}"/>` +
  `<path d="M26 56l-9 3 9 4z" fill="${deep}" stroke="${deep}" stroke-width="2" stroke-linejoin="round"/>` +
  `<clipPath id="bee"><ellipse cx="54" cy="58" rx="30" ry="22"/></clipPath>` +
  `<ellipse cx="54" cy="58" rx="30" ry="22" fill="${main}"/>` +
  `<path d="M44 30v60M60 30v60" stroke="${deep}" stroke-width="8" clip-path="url(#bee)"/>` +
  `<ellipse cx="33" cy="48" rx="4" ry="2.5" fill="${hi}" fill-opacity=".5"/>` +
  `<path d="M74 39l3-11M80 41l7-9" stroke="${deep}" stroke-width="2.5" stroke-linecap="round"/><circle cx="77" cy="27" r="3" fill="${deep}"/><circle cx="88" cy="31" r="3" fill="${deep}"/>` +
  `<circle cx="70" cy="53" r="2.5" fill="${deep}"/><circle cx="79" cy="53" r="2.5" fill="${deep}"/>` +
  `<path d="M70 61q4.5 4 9 0" fill="none" stroke="${deep}" stroke-width="2.5" stroke-linecap="round"/>`;

/** A green snail with a swirly shell, peeping out to say hello. */
const snail = ({ main, shade, other, hi }: Paint) =>
  `<path d="M16 76h64" stroke="${other('leaf')}" stroke-width="13" stroke-linecap="round"/><path d="M80 75V55" stroke="${other('leaf')}" stroke-width="16" stroke-linecap="round"/>` +
  `<path d="M76 49l-4-14M84 49l4-14" stroke="${other('leaf', 1)}" stroke-width="3" stroke-linecap="round"/>` +
  `<circle cx="72" cy="34" r="3.5" fill="${other('leaf', 1)}"/><circle cx="88" cy="34" r="3.5" fill="${other('leaf', 1)}"/>` +
  `<circle cx="77" cy="56" r="2.2" fill="${other('leaf', 2)}"/><circle cx="84" cy="56" r="2.2" fill="${other('leaf', 2)}"/>` +
  `<path d="M76.5 62q4 3.5 8 0" fill="none" stroke="${other('leaf', 2)}" stroke-width="2.2" stroke-linecap="round"/>` +
  `<circle cx="44" cy="50" r="25" fill="${main}"/>` +
  `<path d="M45 51a3 3 0 0 1 6 0 6 6 0 0 1-12 0 9 9 0 0 1 18 0 12 12 0 0 1-24 0 15 15 0 0 1 30 0" fill="none" stroke="${shade}" stroke-width="4.5" stroke-linecap="round"/>` +
  `<ellipse cx="32" cy="36" rx="5" ry="3" transform="rotate(-35 32 36)" fill="${hi}" fill-opacity=".55"/>`;

/** A seedling with two leaves, growing in a little smiling pot. */
const sprout = ({ main, shade, other, hi }: Paint) =>
  `<path d="M50 60V38" stroke="${shade}" stroke-width="5" stroke-linecap="round"/>` +
  `<path d="M49 42c-9-18-27-20-34-12 7 14 23 18 34 12z" fill="${main}"/><path d="M51 36c5-18 23-24 34-18-3 16-21 24-34 18z" fill="${shade}"/>` +
  `<path d="M45 40c-8-6-16-8-24-8M55 34c7-6 15-10 24-12" fill="none" stroke="${hi}" stroke-width="2.5" stroke-linecap="round" stroke-opacity=".6"/>` +
  `<path d="M29 66h42l-5 24H34z" fill="${other('peach')}" stroke="${other('peach')}" stroke-width="2" stroke-linejoin="round"/>` +
  `<rect x="24" y="56" width="52" height="12" rx="4" fill="${other('peach', 1)}"/>` +
  `<circle cx="43" cy="76" r="2.2" fill="${other('peach', 2)}"/><circle cx="57" cy="76" r="2.2" fill="${other('peach', 2)}"/>` +
  `<path d="M45 81q5 4 10 0" fill="none" stroke="${other('peach', 2)}" stroke-width="2.2" stroke-linecap="round"/>`;

/** A ladybird seen from above, with spots and a little head peeking out. */
const ladybird = ({ main, deep, hi }: Paint) =>
  `<path d="M44 20c-3-8-8-10-13-9M56 20c3-8 8-10 13-9" fill="none" stroke="${deep}" stroke-width="2.5" stroke-linecap="round"/>` +
  `<circle cx="31" cy="11" r="3" fill="${deep}"/><circle cx="69" cy="11" r="3" fill="${deep}"/><circle cx="50" cy="30" r="13" fill="${deep}"/>` +
  `<circle cx="45" cy="25" r="2.6" fill="${hi}"/><circle cx="55" cy="25" r="2.6" fill="${hi}"/>` +
  `<circle cx="50" cy="58" r="30" fill="${main}"/><path d="M50 29v58" stroke="${deep}" stroke-width="3"/>` +
  `<g fill="${deep}"><circle cx="37" cy="46" r="6.5"/><circle cx="63" cy="46" r="6.5"/><circle cx="33" cy="66" r="5.5"/><circle cx="67" cy="66" r="5.5"/><circle cx="42" cy="80" r="4"/><circle cx="58" cy="80" r="4"/></g>` +
  `<ellipse cx="28" cy="52" rx="2.5" ry="5" transform="rotate(20 28 52)" fill="${hi}" fill-opacity=".55"/>`;

/** A watering can with a long spout and a sprinkler rose, and a little flower on its side. */
const wateringCan = ({ main, shade, other, hi }: Paint) =>
  `<path d="M30 44c0-22 30-22 30 0" fill="none" stroke="${shade}" stroke-width="6" stroke-linecap="round"/>` +
  `<path d="M62 70l20-25 5 4-25 33z" fill="${main}" stroke="${main}" stroke-width="2" stroke-linejoin="round"/>` +
  `<path d="M80.8 43.6l.2-7.2 13 9.4-6.8 2.6z" fill="${shade}" stroke="${shade}" stroke-width="3" stroke-linejoin="round"/>` +
  `<rect x="20" y="42" width="46" height="44" rx="9" fill="${main}"/><rect x="25" y="48" width="5" height="30" rx="2.5" fill="${hi}" fill-opacity=".5"/>` +
  `<g fill="${hi}" fill-opacity=".8">${ring(5, 6, 4, 45, 64)}</g>` +
  `<circle cx="45" cy="64" r="3.5" fill="${other('butter', 1)}"/>`;

/**
 * The underline: a gently winding vine. The title stretches it about 3:1 sideways, which turns leaves
 * or curls into blobs, so it is a single line. Every point stays inside the 2.5–9.5 band, so nothing
 * is clipped.
 */
const vine = 'M2 7.5 C 16 3.5, 28 3.5, 40 6.5 S 64 9.5, 78 6.5 S 104 3.5, 118 5.5';

export const meadowDoodles: ThemeDoodles = {
  home: [make(caterpillar, 'leaf'), make(sunflower, 'butter'), make(tulip, 'poppy'), make(butterfly, 'sky')],
  page: [make(caterpillar, 'leaf'), make(daisy, 'peach'), make(tulip, 'poppy')],
  sections: [make(bee, 'butter'), make(snail, 'sky'), make(sprout, 'leaf'), make(butterfly, 'sky'), make(ladybird, 'poppy'), make(wateringCan, 'leaf')],
  underline: vine,
};
