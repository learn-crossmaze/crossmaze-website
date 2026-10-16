// Montessori Calm: a nature-table and wooden-toy set (rainbow stacker, felt sun, acorn, leaf, flower,
// toadstool, little tree, pink tower and a wooden bird) in sage, honey, clay, dusty rose, dusty blue
// and natural wood. Soft, earthy pastels by day; at night, clearer mid-tones that glow warmly on the
// deep moss-and-olive page (dimmed pastels would turn khaki there).
import { type Colors, type Doodle, type ThemeDoodles, doodle } from './shared';

/** Pastel enough to sit quietly behind text. */
const pastel = {
  sage: ['#cfe1c2', '#b3cfa2'],
  honey: ['#f5dc9c', '#eec66f'],
  clay: ['#f3c9b2', '#e9ad8e'],
  rose: ['#eec3bd', '#e2a29a'],
  blue: ['#c9dbea', '#a9c4dc'],
  wood: ['#efd5b1', '#dcb588'],
} satisfies Record<string, Colors>;

/** The night versions of the pastels: more colour, less light, so they glow on the dark moss page. */
const night = {
  sage: ['#93c584', '#73ad62'],
  honey: ['#eec25a', '#dba63a'],
  clay: ['#ec9470', '#da7753'],
  rose: ['#f49ca2', '#e27c85'],
  blue: ['#86afd6', '#6894c2'],
  wood: ['#ebb877', '#d39b59'],
} satisfies Record<keyof typeof pastel, Colors>;

type Colour = keyof typeof pastel;
type Draw = (colors: Colors, atNight: boolean) => string;

/** Another colour from the set, for a doodle's extra parts: `tone(atNight)('clay')`, or its shade with `('clay', 1)`. */
const tone =
  (atNight: boolean) =>
  (colour: Colour, shade: 0 | 1 = 0) =>
    (atNight ? night : pastel)[colour][shade];

/** Soft highlights: white by day, a warm oat tint at night (pure white glares on the dark page). */
const shine = (atNight: boolean) => (atNight ? '#f1ead6' : '#fff');

/** A face colour (eyes, smiles): the doodle's own colour, same hue but deeper, never black. */
function deep(hex: string, atNight: boolean): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  const hue = d === 0 ? 0 : max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  const [s, l] = atNight ? [0.55, 0.25] : [0.45, 0.45];
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + hue * 2) % 12;
    return Math.round((l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

/** Rounds to one decimal, for computed points; r1 gives it as text. */
const round = (v: number) => Math.round(v * 10) / 10;
const r1 = (v: number) => String(round(v));
/** The point at `deg` degrees on a circle of radius r round (cx, cy), as "x y". */
const at = (cx: number, cy: number, r: number, deg: number) =>
  `${r1(cx + r * Math.cos((deg * Math.PI) / 180))} ${r1(cy + r * Math.sin((deg * Math.PI) / 180))}`;

/** A wooden rainbow stacker: three nested arches round a little half-moon, wide and low like a cloud. Each piece has its own colour. */
const stacker: Draw = (_colors, atNight) => {
  const t = tone(atNight);
  // An arch from radius R in to radius r, standing on the line y = 76, its corners softly rounded by a
  // stroke of its own colour; a hairline seam (half a unit) of page shows between one piece and the next.
  const arch = (R: number, r: number, fill: string) =>
    `<path d="M${50 - R} 76A${R} ${R} 0 0 1 ${50 + R} 76H${50 + r}A${r} ${r} 0 0 0 ${50 - r} 76z" fill="${fill}" stroke="${fill}" stroke-width="2" stroke-linejoin="round"/>`;
  return (
    arch(42, 33.5, t('clay')) +
    arch(31, 22.5, t('honey')) +
    arch(20, 11.5, t('sage')) +
    `<path d="M40 76a10 10 0 0 1 20 0z" fill="${t('blue')}" stroke="${t('blue')}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M${at(50, 76, 38, 200)}A38 38 0 0 1 ${at(50, 76, 38, 238)}" fill="none" stroke="${shine(atNight)}" stroke-width="3" stroke-linecap="round" stroke-opacity=".5"/>`
  );
};

/** A smiling felt sun with rounded rays and a stitched edge, eyes closed, quite content. */
const sun: Draw = ([main, shade], atNight) => {
  const face = deep(shade, atNight);
  // Ten rays, each wide at the foot and tapering to a rounded tip, standing a little clear of the disc
  // (foot at y 20.5, disc from y 23) so it reads as a sun, not a flower.
  const ray = 'M47.6 7Q50 3.6 52.4 7L56.6 17.6Q57.2 20.5 50 20.5T43.4 17.6z';
  const rays = Array.from({ length: 10 }, (_, i) => `<path d="${ray}" transform="rotate(${i * 36} 50 50)"/>`).join('');
  return (
    `<g fill="${shade}">${rays}</g>` +
    `<circle cx="50" cy="50" r="27" fill="${main}"/>` +
    `<circle cx="50" cy="50" r="22" fill="none" stroke="${shine(atNight)}" stroke-width="2" stroke-dasharray="3.5 3.5" stroke-opacity=".7"/>` +
    `<path d="M38 46q4-4 8 0M54 46q4-4 8 0M42 55c4 5 12 5 16 0" fill="none" stroke="${face}" stroke-width="3" stroke-linecap="round"/>` +
    `<g fill="${tone(atNight)('clay', 1)}" fill-opacity=".55"><circle cx="35" cy="54" r="3.5"/><circle cx="65" cy="54" r="3.5"/></g>`
  );
};

/** An acorn in its criss-cross cap, with a little stalk: tall and narrow, like a balloon. */
const acorn: Draw = ([main, shade], atNight) => {
  const cap = 'M20 44c0-14 13-24 30-24s30 10 30 24c0 4-3 7-7 7H27c-4 0-7-3-7-7z';
  // Criss-cross lines over the cap's box (x 20–80, y 20–51), clipped to its outline: each "/" rises
  // from the rim at x0 and is cut at the box's sides, and has a mirror image "\".
  const lattice = [8, 20, 32, 44, 56, 68]
    .map((x0) => {
      const y = (x: number) => 51 - (31 * (x - x0)) / 24;
      const [a, b] = [Math.max(20, x0), Math.min(80, x0 + 24)];
      return `M${r1(a)} ${r1(y(a))}L${r1(b)} ${r1(y(b))}M${r1(100 - a)} ${r1(y(a))}L${r1(100 - b)} ${r1(y(b))}`;
    })
    .join('');
  return (
    `<clipPath id="cap"><path d="${cap}"/></clipPath>` +
    `<path d="M50 22c0-6 3-10 8-12" fill="none" stroke="${shade}" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M28 44c0 24 12 40 22 46 10-6 22-22 22-46z" fill="${main}"/>` +
    `<path d="M50 88v6" stroke="${main}" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="${cap}" fill="${shade}"/>` +
    `<path d="${lattice}" clip-path="url(#cap)" fill="none" stroke="${shine(atNight)}" stroke-width="2.5" stroke-opacity=".4"/>` +
    `<ellipse cx="38" cy="62" rx="4" ry="9" transform="rotate(-12 38 62)" fill="${shine(atNight)}" fill-opacity=".5"/>`
  );
};

/** A leaf drifting on the breeze, with a curved stalk and veins. */
const leaf: Draw = ([main, shade], atNight) => (
  `<path d="M24 66c-6 4-10 10-12 18" fill="none" stroke="${shade}" stroke-width="4.5" stroke-linecap="round"/>` +
  `<path d="M20 70C20 40 46 16 90 12 88 52 62 78 30 78z" fill="${main}"/>` +
  `<path d="M24 74C40 56 58 36 82 20M44 54l-2-14M44 54l14 2M58 40l-1-13M58 40l13 1" fill="none" stroke="${shade}" stroke-width="3.5" stroke-linecap="round"/>` +
  `<ellipse cx="38" cy="44" rx="4" ry="9" transform="rotate(40 38 44)" fill="${shine(atNight)}" fill-opacity=".5"/>`
);

/** A five-petalled flower with a round centre: bold enough to read while it spins. */
const flower =
  (centre: Colour): Draw =>
  ([main, shade], atNight) => {
    const petals = [0, 72, 144, 216, 288].map((deg) => `<ellipse cx="50" cy="26" rx="15.5" ry="18" transform="rotate(${deg} 50 50)"/>`).join('');
    // The petals twice: first a wide stroke in the shade, then filled on top with no stroke, so the
    // outline runs evenly round the outside with no seams between petals (symmetric as it spins).
    return (
      `<g fill="${shade}" stroke="${shade}" stroke-width="6">${petals}</g>` +
      `<g fill="${main}">${petals}</g>` +
      `<circle cx="50" cy="50" r="15" fill="${tone(atNight)(centre, 1)}"/>` +
      `<circle cx="45" cy="45" r="4.5" fill="${shine(atNight)}" fill-opacity=".55"/>`
    );
  };

/** A spotty toadstool with a little smile on its stalk. */
const toadstool: Draw = ([main, shade], atNight) => {
  const t = tone(atNight);
  const face = deep(t('wood', 1), atNight);
  return (
    `<path d="M36 58c-2 10-3 22-1 28 6 4 24 4 30 0 2-6 1-18-1-28z" fill="${t('wood')}"/>` +
    `<path d="M12 54c0-24 18-40 38-40s38 16 38 40c0 5-4 8-9 8H21c-5 0-9-3-9-8z" fill="${main}"/>` +
    `<path d="M22 60h56" stroke="${shade}" stroke-width="3.5" stroke-linecap="round"/>` +
    `<g fill="${shine(atNight)}" fill-opacity=".75"><circle cx="34" cy="34" r="6"/><circle cx="58" cy="26" r="4.5"/><circle cx="68" cy="46" r="5.5"/><circle cx="46" cy="48" r="3.5"/><circle cx="22" cy="50" r="3"/></g>` +
    `<circle cx="44" cy="72" r="2.6" fill="${face}"/><circle cx="56" cy="72" r="2.6" fill="${face}"/>` +
    `<path d="M46 78c2.5 2.5 5.5 2.5 8 0" fill="none" stroke="${face}" stroke-width="2.6" stroke-linecap="round"/>`
  );
};

/** A little round tree on a wooden trunk, standing on a grassy mound, with three apples. */
const tree: Draw = ([main, shade], atNight) => {
  const t = tone(atNight);
  return (
    `<path d="M50 90V60" stroke="${t('wood', 1)}" stroke-width="7" stroke-linecap="round"/>` +
    `<path d="M50 10c13 0 22 9 22 19 9 3 14 11 14 19 0 12-10 20-22 20H36c-12 0-22-8-22-20 0-8 5-16 14-19 0-10 9-19 22-19z" fill="${main}"/>` +
    `<path d="M14 92c10-8 62-8 72 0z" fill="${shade}"/>` +
    `<g fill="${t('clay', 1)}"><circle cx="38" cy="40" r="4.5"/><circle cx="62" cy="34" r="4.5"/><circle cx="64" cy="54" r="4.5"/></g>` +
    `<ellipse cx="36" cy="25" rx="5" ry="8" transform="rotate(40 36 25)" fill="${shine(atNight)}" fill-opacity=".5"/>`
  );
};

/** The Montessori pink tower: four wooden cubes, seen a little from above, stacked biggest to smallest. */
const tower: Draw = ([main, shade], atNight) => {
  // Each cube is a front square with a top face and a side face leaning back by 0.3 of its size.
  // (cx, cy) is the middle of the spot it stands on: centred on x = 50 at the bottom (whose front
  // edge is on y = 94), then the middle of the top face of the cube below. A big base cube (ink box
  // x 22–78) gives it the weight of the other margin doodles; each cube above is about half the size.
  let [cx, cy] = [50, 87.7];
  const cubes = [42, 21, 12, 7].map((s) => {
    const d = round(s * 0.3);
    const [x, y] = [round(cx - s / 2 - d / 2), round(cy + d / 2)]; // the front face's bottom left corner
    [cx, cy] = [x + s / 2 + d / 2, y - s - d / 2];
    const lean = `l${d}-${d}`;
    return (
      `<path d="M${r1(x + s)} ${r1(y - s)}${lean}v${s}l-${d} ${d}z" fill="${shade}" stroke="${shade}"/>` +
      `<path d="M${x} ${y}v-${s}${lean}h${s}l-${d} ${d}v${s}z" fill="${main}" stroke="${main}"/>` +
      `<path d="M${x} ${r1(y - s)}${lean}h${s}l-${d} ${d}z" fill="${shine(atNight)}" fill-opacity=".45"/>`
    );
  });
  return `<g stroke-width="1.5" stroke-linejoin="round">${cubes.join('')}</g>`;
};

/** A chubby wooden bird with a honey beak, standing on two little legs. */
const bird: Draw = ([main, shade], atNight) => {
  const t = tone(atNight);
  const face = deep(shade, atNight);
  return (
    `<path d="M44 78v10M56 78v10" stroke="${t('wood', 1)}" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M30 52L10 34c-2-2 0-6 3-5l25 12z" fill="${shade}" stroke="${shade}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M84 38l10 5-10 5z" fill="${t('honey', 1)}" stroke="${t('honey', 1)}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M20 60c0-16 14-24 30-24 2-10 10-16 20-16 10 0 16 8 16 18 0 6-2 10-4 14 0 16-12 28-32 28-18 0-30-8-30-20z" fill="${main}"/>` +
    `<path d="M34 56c8-10 22-10 30 0-6 10-22 12-30 0z" fill="${shade}"/>` +
    `<circle cx="73" cy="36" r="3.4" fill="${face}"/>` +
    `<circle cx="76" cy="45" r="3.5" fill="${t('clay', 1)}" fill-opacity=".55"/>` +
    `<ellipse cx="62" cy="27" rx="3.5" ry="6" transform="rotate(50 62 27)" fill="${shine(atNight)}" fill-opacity=".5"/>`
  );
};

const make = (draw: Draw, colour: Colour): Doodle => doodle(draw, pastel[colour], night[colour]);

/**
 * A running stitch under the title, like the edge of a felt toy: seven short dashes along one gentle
 * wave from x 2 to 118, each one's ends inside the 2.5–9.5 band so the round caps are never clipped.
 */
const stitches = Array.from({ length: 7 }, (_, i) => {
  const wave = (x: number) => 6 + 2.6 * Math.sin(((x - 2) / 116) * 2 * Math.PI);
  const x1 = 2 + (i * (116 - 10)) / 6;
  const x2 = x1 + 10;
  return `M${r1(x1)} ${r1(wave(x1))} L${r1(x2)} ${r1(wave(x2))}`;
}).join(' ');

// The rainbow stacker paints each arch its own colour, so the colour passed to make() goes unused.
export const calmDoodles: ThemeDoodles = {
  home: [make(stacker, 'clay'), make(sun, 'honey'), make(acorn, 'wood'), make(leaf, 'sage')],
  page: [make(stacker, 'clay'), make(flower('honey'), 'rose'), make(acorn, 'wood')],
  sections: [make(toadstool, 'clay'), make(tree, 'sage'), make(tower, 'rose'), make(leaf, 'sage'), make(bird, 'blue'), make(flower('clay'), 'honey')],
  underline: stitches,
};
