// Candy Pop: a sweet-shop set (wrapped sweet, sprinkled doughnut, swirl lollipop, cherries,
// peppermint, cupcake, ice-cream cone, gummy bear, ice lolly) in bubblegum pink, grape, turquoise
// and lemon, round and bubbly. Soft pastels by day; at night, clearer candy colours that glow on the
// plum party-night page (dimmed pastels turn grey).
import { type Colors, type Doodle, type ThemeDoodles, doodle } from './shared';

/** Pastel enough to sit quietly behind text. */
const pastel = {
  bubblegum: ['#ffc4e1', '#ffa6d1'],
  grape: ['#dccbff', '#c5abff'],
  mint: ['#b3efdf', '#8de2ca'],
  lemon: ['#fff09a', '#ffe066'],
  sky: ['#c5e0ff', '#a7cdfd'],
} satisfies Record<string, Colors>;

/** The night versions of the pastels: more colour, less light, so they glow on the plum page. */
const night = {
  bubblegum: ['#ff7fc0', '#f25ca8'],
  grape: ['#ac82ff', '#9062f5'],
  mint: ['#3fd3b0', '#21b994'],
  lemon: ['#f7d23e', '#e3b51c'],
  sky: ['#72aef8', '#5390ec'],
} satisfies Record<keyof typeof pastel, Colors>;

type Colour = keyof typeof pastel;
type Draw = (colors: Colors, atNight: boolean) => string;

/** The palette by day or at night, for a doodle's fixed details (a cone, a stem, sprinkles…). */
const tones = (atNight: boolean) => (atNight ? night : pastel);

/** Soft highlights: white by day, a pale pink tint at night (pure white glares on the dark page). */
const shine = (atNight: boolean) => (atNight ? '#f6dcf0' : '#fff');

/** A biscuit colour for cones and doughnuts, and its toasty shade. */
const biscuit = (atNight: boolean): Colors => (atNight ? ['#eeaa68', '#cf8644'] : ['#ffd9ad', '#f5bf83']);

/** A face colour (eyes, smiles): the doodle's own hue, deeper and richer, never black. */
function deep(hex: string, atNight: boolean): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  const hue = d === 0 ? 0 : max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  const [s, l] = atNight ? [0.6, 0.27] : [0.55, 0.5];
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + hue * 2) % 12;
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(v * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

/** `hex` mixed with white: `k` = 0 keeps the colour, 1 is white. */
function tint(hex: string, k: number): string {
  return `#${[1, 3, 5]
    .map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - k) + 255 * k).toString(16).padStart(2, '0'))
    .join('')}`;
}

/** A number rounded to one decimal, to keep the markup short. */
const r1 = (v: number) => Math.round(v * 10) / 10;

/** A point on a circle round (cx, cy) at an angle in degrees, rounded to one decimal. */
const point = (cx: number, cy: number, r: number, deg: number): [number, number] => [
  r1(cx + r * Math.cos((deg * Math.PI) / 180)),
  r1(cy + r * Math.sin((deg * Math.PI) / 180)),
];

/** The same point as "x y", for path data. */
const at = (cx: number, cy: number, r: number, deg: number) => point(cx, cy, r, deg).join(' ');

/** A short rounded sprinkle at (x, y), tilted by `deg`. */
const sprinkle = (x: number, y: number, deg: number, colour: string) =>
  `<path d="M${at(x, y, 3.5, deg + 180)}L${at(x, y, 3.5, deg)}" stroke="${colour}" stroke-width="3.5" stroke-linecap="round"/>`;

/**
 * A wrapped sweet with crinkled, twisted ends: wide and low, like a cloud. Its stripes stop short of the
 * edge (every point lies inside the body shrunk by the stroke's half-width), so their round caps never
 * poke out. By day they are a little fainter, so the oval body still shows on the lavender banner.
 */
const sweet: Draw = ([main, shade], atNight) => {
  // The left end fans out from the twist to a zigzag edge; the right end is its mirror image.
  const end = 'M29 50L12 32L8.5 37L11 41.5L8.5 46L11 50L8.5 54L11 58.5L8.5 63L12 68Z';
  const stripes = 'M43 35c-3 9-6 20-9 25M55 34c-3 11-7 24-12 32M64 38c-3 9-7 20-12 27';
  return (
    `<g fill="${shade}" stroke="${shade}" stroke-width="3" stroke-linejoin="round"><path d="${end}"/><path d="${end}" transform="matrix(-1 0 0 1 100 0)"/></g>` +
    `<path d="M15 41l10 6M15 59l10-6M85 41l-10 6M85 59l-10-6" stroke="${main}" stroke-width="3" stroke-linecap="round"/>` +
    `<ellipse cx="50" cy="50" rx="23" ry="20" fill="${main}"/>` +
    `<path d="${stripes}" fill="none" stroke="${shine(atNight)}" stroke-width="4.5" stroke-linecap="round" stroke-opacity="${atNight ? '.55' : '.45'}"/>`
  );
};

/** A doughnut seen from above: icing with a scalloped edge, sprinkles and a hole in the middle. */
const doughnut: Draw = ([main], atNight) => {
  const [dough] = biscuit(atNight);
  const t = tones(atNight);
  // Nine scallops round the icing: each bulges out between two points on a circle.
  const scallops = Array.from({ length: 9 }, (_, i) => `Q${at(50, 50, 41, -70 + 40 * i)} ${at(50, 50, 32, -50 + 40 * i)}`).join('');
  const ring = (r: number) => `M${50 - r} 50a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0-${2 * r} 0z`;
  const colours = [t.lemon[1], t.mint[1], shine(atNight), t.grape[1], t.sky[1], t.lemon[1], t.mint[1], shine(atNight)];
  const sprinkles = colours.map((c, i) => {
    const deg = -60 + 45 * i;
    const [x, y] = point(50, 50, i % 2 ? 26 : 22, deg);
    return sprinkle(x, y, deg + 70 + 35 * (i % 3), c);
  });
  return (
    `<path d="${ring(40)}${ring(12)}" fill="${dough}" fill-rule="evenodd"/>` +
    `<path d="M${at(50, 50, 32, -90)}${scallops}z${ring(15.5)}" fill="${main}" fill-rule="evenodd" stroke="${main}" stroke-width="3" stroke-linejoin="round"/>` +
    sprinkles.join('') +
    `<path d="M${at(50, 50, 29, 195)}A29 29 0 0 1 ${at(50, 50, 29, 240)}" fill="none" stroke="${shine(atNight)}" stroke-width="4" stroke-linecap="round" stroke-opacity=".55"/>`
  );
};

/** A round swirl lollipop on a stick with a little bow: tall and narrow, like a balloon. */
const lollipop: Draw = ([main, shade], atNight) => {
  const t = tones(atNight);
  return (
    `<rect x="47.5" y="58" width="5" height="36" rx="2.5" fill="${t.grape[0]}"/>` +
    `<circle cx="50" cy="36" r="27" fill="${main}"/>` +
    `<path d="M50 36a4 4 0 0 1 8 0a8 8 0 0 1-16 0a12 12 0 0 1 24 0a16 16 0 0 1-32 0a20 20 0 0 1 40 0" fill="none" stroke="${shade}" stroke-width="5.5" stroke-linecap="round"/>` +
    `<ellipse cx="36" cy="22" rx="4" ry="7" transform="rotate(45 36 22)" fill="${shine(atNight)}" fill-opacity=".6"/>` +
    `<path d="M50 70l-10-6v12zM50 70l10-6v12z" fill="${t.bubblegum[1]}" stroke="${t.bubblegum[1]}" stroke-width="3" stroke-linejoin="round"/>` +
    `<circle cx="50" cy="70" r="3.5" fill="${t.bubblegum[0]}"/>`
  );
};

/** Two round cherries on joined stems, with a leaf. */
const cherries: Draw = ([main, shade], atNight) => {
  const [leaf, stem] = tones(atNight).mint;
  return (
    `<path d="M34 54C36 40 46 28 60 18M66 56C67 42 64 30 60 18" fill="none" stroke="${stem}" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M60 18c6-9 18-11 25-6-5 9-17 11-25 6z" fill="${leaf}"/><path d="M64 16c5-2 10-3 15-2" fill="none" stroke="${stem}" stroke-width="2.5" stroke-linecap="round"/>` +
    `<circle cx="34" cy="68" r="16" fill="${main}"/><circle cx="66" cy="70" r="16" fill="${shade}"/>` +
    `<ellipse cx="27" cy="62" rx="4" ry="6" transform="rotate(30 27 62)" fill="${shine(atNight)}" fill-opacity=".6"/>` +
    `<ellipse cx="59" cy="64" rx="4" ry="6" transform="rotate(30 59 64)" fill="${shine(atNight)}" fill-opacity=".6"/>`
  );
};

/**
 * A peppermint: a round sweet with pinwheel swirls. Bold and round, so it reads while it spins. At night
 * the white stripes are a light tint of its colour: they don't glare, and keep their colour rather than
 * turning grey when the section doodles fade to 60%.
 */
const peppermint: Draw = ([main, shade], atNight) => {
  // Six curved wedges; each edge bends back towards the centre, so the stripes swirl.
  const wedges = Array.from({ length: 6 }, (_, i) => {
    const a = 60 * i;
    return `M50 50Q${at(50, 50, 24, a - 30)} ${at(50, 50, 40, a)}A40 40 0 0 1 ${at(50, 50, 40, a + 30)}Q${at(50, 50, 24, a)} 50 50z`;
  }).join('');
  return (
    `<circle cx="50" cy="50" r="40" fill="${atNight ? tint(main, 0.45) : '#fff'}"/>` +
    `<path d="${wedges}" fill="${main}"/>` +
    `<circle cx="50" cy="50" r="40" fill="none" stroke="${shade}" stroke-width="5"/>` +
    `<circle cx="50" cy="50" r="6" fill="${shade}"/>`
  );
};

/** A cupcake: tiers of icing with a cherry and sprinkles, in a pleated, smiling paper case. */
const cupcake: Draw = ([main, shade], atNight) => {
  const t = tones(atNight);
  const [paper, pleat] = t.mint;
  const face = deep(pleat, atNight);
  // Each tier of icing sits on a soft shadow in the shade colour.
  const tier = (x: number, y: number, w: number) =>
    `<rect x="${x}" y="${y + 3}" width="${w}" height="14" rx="7" fill="${shade}"/><rect x="${x}" y="${y}" width="${w}" height="14" rx="7" fill="${main}"/>`;
  return (
    `<path d="M24 60h52l-7 30H31z" fill="${paper}" stroke="${paper}" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="M37 64l2 22M63 64l-2 22" stroke="${pleat}" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M17 51h66v5a7 7 0 0 1-7 7H24a7 7 0 0 1-7-7z" fill="${main}"/>` +
    tier(17, 47, 66) +
    tier(25, 36, 50) +
    tier(34, 26, 32) +
    `<path d="M50 20c1-5 4-8 8-9" fill="none" stroke="${t.mint[1]}" stroke-width="3" stroke-linecap="round"/>` +
    `<circle cx="50" cy="22" r="7" fill="${t.bubblegum[1]}"/><circle cx="47.5" cy="19.5" r="2" fill="${shine(atNight)}" fill-opacity=".7"/>` +
    sprinkle(31, 52, 30, t.lemon[1]) +
    sprinkle(64, 41, -40, t.sky[1]) +
    sprinkle(44, 41, 70, shine(atNight)) +
    sprinkle(70, 54, 100, t.bubblegum[1]) +
    `<circle cx="43" cy="73" r="2.6" fill="${face}"/><circle cx="57" cy="73" r="2.6" fill="${face}"/>` +
    `<path d="M46 79c2.5 2.5 5.5 2.5 8 0" fill="none" stroke="${face}" stroke-width="2.6" stroke-linecap="round"/>`
  );
};

/** An ice-cream cone with two scoops: the lower one drips over a criss-cross waffle cone. */
const iceCream: Draw = ([main, shade], atNight) => {
  const t = tones(atNight);
  const [cone, waffle] = biscuit(atNight);
  const drips = Array.from({ length: 6 }, () => 'q-3.8 7-7.7 0').join('');
  return (
    `<path d="M31 56h38L52 92h-4z" fill="${cone}" stroke="${cone}" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="M43 56l-6 13M56 56l-12 26M44 56l12 26M57 56l6 13" stroke="${waffle}" stroke-width="3" stroke-linecap="round"/>` +
    `<circle cx="50" cy="31" r="17" fill="${t.bubblegum[0]}"/>` +
    `<ellipse cx="43" cy="24" rx="3.5" ry="6" transform="rotate(40 43 24)" fill="${shine(atNight)}" fill-opacity=".6"/>` +
    `<path d="M27 56a23 17 0 0 1 46 0${drips}z" fill="${main}" stroke="${main}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M33 51c3-6 9-9 15-9" fill="none" stroke="${shine(atNight)}" stroke-width="3.5" stroke-linecap="round" stroke-opacity=".6"/>` +
    sprinkle(58, 47, 30, shade) +
    sprinkle(44, 22, -30, t.lemon[1]) +
    sprinkle(57, 30, 60, t.mint[1])
  );
};

/**
 * A chunky gummy bear, as if made of jelly: a squarish silhouette in the shade with the main colour
 * inside it, so the edges look thicker and deeper, like light through a gummy sweet, plus glossy
 * highlights and a little smile.
 */
const gummyBear: Draw = ([main, shade], atNight) => {
  const s = shine(atNight);
  const face = deep(shade, atNight);
  // The silhouette: ears, arms, feet, tummy and head (fattened a little by the stroke).
  const silhouette =
    '<circle cx="33" cy="18" r="8"/><circle cx="67" cy="18" r="8"/>' +
    '<rect x="20" y="46" width="14" height="24" rx="7" transform="rotate(25 27 58)"/><rect x="66" y="46" width="14" height="24" rx="7" transform="rotate(-25 73 58)"/>' +
    '<rect x="26" y="74" width="21" height="18" rx="9"/><rect x="53" y="74" width="21" height="18" rx="9"/>' +
    '<rect x="29" y="40" width="42" height="44" rx="17"/><rect x="27" y="15" width="46" height="35" rx="16"/>';
  // The same parts, 3.5 units smaller all round.
  const middle =
    '<circle cx="33" cy="18" r="4.5"/><circle cx="67" cy="18" r="4.5"/>' +
    '<rect x="23.5" y="49.5" width="7" height="17" rx="3.5" transform="rotate(25 27 58)"/><rect x="69.5" y="49.5" width="7" height="17" rx="3.5" transform="rotate(-25 73 58)"/>' +
    '<rect x="29.5" y="77.5" width="14" height="11" rx="5.5"/><rect x="56.5" y="77.5" width="14" height="11" rx="5.5"/>' +
    '<rect x="32.5" y="43.5" width="35" height="37" rx="14"/><rect x="30.5" y="18.5" width="39" height="28" rx="13"/>';
  return (
    `<g fill="${shade}" stroke="${shade}" stroke-width="3" stroke-linejoin="round">${silhouette}</g>` +
    `<g fill="${main}">${middle}</g>` +
    `<path d="M35 40c-1-8 2-14 9-17M38 53c-2 6-2 14 0 20" fill="none" stroke="${s}" stroke-width="4.5" stroke-linecap="round" stroke-opacity=".55"/>` +
    `<circle cx="42" cy="31" r="2.8" fill="${face}"/><circle cx="58" cy="31" r="2.8" fill="${face}"/>` +
    `<path d="M46 37c2.5 2.5 5.5 2.5 8 0" fill="none" stroke="${face}" stroke-width="2.4" stroke-linecap="round"/>`
  );
};

/** A striped ice lolly with a bite out of the top and a drip, on a wooden stick. */
const iceLolly: Draw = ([main], atNight) => {
  const t = tones(atNight);
  const [stick] = biscuit(atNight);
  // A round-topped bar; the bite is a small circle's arc cut into its top right corner.
  const bar = 'M28 30A22 22 0 0 1 63.6 12.7A9 9 0 0 0 71.4 25A22 22 0 0 1 72 30V68a6 6 0 0 1-6 6H34a6 6 0 0 1-6-6z';
  return (
    `<rect x="44" y="66" width="12" height="28" rx="6" fill="${stick}"/>` +
    `<path d="${bar}" fill="${main}"/>` +
    // The lemon band runs on below the pink band's wavy top, so no grape shows between them.
    `<path d="M28 46q5.5-4 11 0t11 0 11 0 11 0v16H28z" fill="${t.lemon[0]}"/>` +
    `<path d="M28 59q5.5-4 11 0t11 0 11 0 11 0v9a6 6 0 0 1-6 6H34a6 6 0 0 1-6-6z" fill="${t.bubblegum[1]}"/>` +
    `<path d="M57 72v7a3.5 3.5 0 0 0 7 0v-7z" fill="${t.bubblegum[1]}"/>` +
    `<path d="M36 26v28" stroke="${shine(atNight)}" stroke-width="4.5" stroke-linecap="round" stroke-opacity=".55"/>`
  );
};

const make = (draw: Draw, colour: Colour): Doodle => doodle(draw, pastel[colour], night[colour]);

/**
 * The wrapped sweet drifts over the lavender top of the banners, where the grape pastel would wash
 * out, so by day it is a slightly deeper grape (at night it is the usual grape).
 */
const wrappedSweet = doodle(sweet, ['#d2bcff', '#b89aff'], night.grape);

/**
 * Icing scallops under the title: six little swags hanging between points on a line, each a curve
 * whose control points sit at the bottom of the 2.5–9.5 band, so the stroke is never clipped.
 */
const scallops =
  'M2 3.5 ' +
  Array.from({ length: 6 }, (_, i) => {
    const x = 2 + (116 / 6) * i;
    const w = 116 / 6;
    return `C ${r1(x + w * 0.1)} 9.5, ${r1(x + w * 0.9)} 9.5, ${r1(x + w)} 3.5`;
  }).join(' ');

export const candyDoodles: ThemeDoodles = {
  home: [wrappedSweet, make(doughnut, 'bubblegum'), make(lollipop, 'mint'), make(cherries, 'bubblegum')],
  page: [wrappedSweet, make(peppermint, 'bubblegum'), make(lollipop, 'mint')],
  sections: [
    make(cupcake, 'grape'),
    make(iceCream, 'mint'),
    make(gummyBear, 'sky'),
    make(cherries, 'bubblegum'),
    make(iceLolly, 'grape'),
    make(peppermint, 'mint'),
  ],
  underline: scallops,
};
