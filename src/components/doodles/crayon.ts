// Crayon Box: an art-class set (smiling crayon, box of crayons, paint palette, paint pot, paintbrush,
// easel, pencil, scissors, glue bottle and a scribbled-in star) in the logo's bright primaries: red,
// yellow, blue and green, with orange and purple. Soft pastels by day; at night, clear mid-tones that
// glow on the chalkboard-indigo page (dimmed pastels turn grey, and orange turns wood-brown).
import { type Colors, type Doodle, type ThemeDoodles, doodle } from './shared';

/** Pastel enough to sit quietly behind text. */
const pastel = {
  red: ['#ffc2b8', '#ffa294'],
  orange: ['#ffd2ab', '#ffb680'],
  yellow: ['#ffe286', '#ffcd4c'],
  green: ['#bfe8c8', '#97d8a8'],
  blue: ['#c2d6ff', '#a0bdfd'],
  purple: ['#dccbff', '#c3a9ff'],
} satisfies Record<string, Colors>;

/** The night versions of the pastels: more colour, less light, so they glow on the dark page. */
const night = {
  red: ['#ff7f6d', '#f15f4b'],
  orange: ['#ffb36b', '#ff9447'],
  yellow: ['#f8c440', '#e3a51c'],
  green: ['#4cc970', '#2fae55'],
  blue: ['#6c9cff', '#4f7ff0'],
  purple: ['#a98bff', '#8b69f2'],
} satisfies Record<keyof typeof pastel, Colors>;

type Colour = keyof typeof pastel;

/** Face colours (eyes, smiles), by day and at night: each colour's own hue, deeper, never black. */
const faces = {
  red: ['#b8402e', '#6b2016'],
  orange: ['#b8682e', '#6b3a16'],
  yellow: ['#b8912e', '#6b4f16'],
  green: ['#2a9447', '#16692f'],
  blue: ['#2e59b8', '#18306b'],
  purple: ['#5a30b8', '#2c176b'],
} satisfies Record<Colour, [string, string]>;

/** A drawing: its main colour and shade, whether it is night, and the colour for its face (if it has one). */
type Draw = (colors: Colors, atNight: boolean, ink: string) => string;

/** Another crayon from the box, for a doodle's extra parts: `tone(atNight)('red')`, or its shade with `('red', 1)`. */
const tone =
  (atNight: boolean) =>
  (colour: Colour, shade: 0 | 1 = 0) =>
    (atNight ? night : pastel)[colour][shade];

/** Soft highlights (and white glue): white by day, a pale lavender tint at night (pure white glares on the dark page). */
const shine = (atNight: boolean) => (atNight ? '#e2e0fb' : '#fff');

/** Metal (a brush's ferrule, scissor blades, a pencil's band): silver by day, a soft blue-grey at night. */
const metal = (atNight: boolean): Colors => (atNight ? ['#b8c0de', '#959fc8'] : ['#d6dbeb', '#b7bfd8']);

/** Bare wood (a sharpened pencil tip): pale tan by day, a warmer tan at night. */
const wood = (atNight: boolean) => (atNight ? '#e9c39a' : '#ffe3c4');

/** Two dot eyes and a smile, centred on x, eyes at height y. */
const face = (x: number, y: number, colour: string, gap = 7) =>
  `<circle cx="${x - gap}" cy="${y}" r="3" fill="${colour}"/><circle cx="${x + gap}" cy="${y}" r="3" fill="${colour}"/>` +
  `<path d="M${x - 5} ${y + 6}c3 3.5 7 3.5 10 0" fill="none" stroke="${colour}" stroke-width="3" stroke-linecap="round"/>`;

/**
 * A paint palette, wide and low like a cloud: a thumb hole, a notch, and blobs of red, blue and green
 * paint (the deeper shades by day, to stand out on the yellow; the brighter ones at night, to glow).
 */
const palette: Draw = ([main, shade], atNight) => {
  const t = tone(atNight);
  const body =
    'M50 16C74 16 92 27 92 42c0 9-7 13-14 12-7-1-11 3-8 9 3 6-5 9-20 9C26 72 8 61 8 43 8 27 27 16 50 16z' +
    'M50 60a6 6 0 1 0 12 0 6 6 0 1 0-12 0z';
  const blob = (x: number, y: number, colour: Colour) =>
    `<circle cx="${x}" cy="${y}" r="8" fill="${t(colour, atNight ? 0 : 1)}"/><circle cx="${x - 2.5}" cy="${y - 2.5}" r="2.2" fill="${shine(atNight)}" fill-opacity=".6"/>`;
  return (
    `<path d="${body}" transform="translate(0 4)" fill="${shade}" fill-rule="evenodd"/>` +
    `<path d="${body}" fill="${main}" fill-rule="evenodd"/>` +
    blob(27, 41, 'red') +
    blob(45, 28, 'blue') +
    blob(66, 29, 'green') +
    `<path d="M18 52c4 6 10 9 17 10" fill="none" stroke="${shine(atNight)}" stroke-width="4" stroke-linecap="round" stroke-opacity=".55"/>`
  );
};

/**
 * A smiling paint pot brimming with red paint, drips down its side and a brush standing in it. Kept
 * low, with the face high up, because at the top right of the home banner the photo hides its bottom.
 */
const paintPot: Draw = ([main, shade], atNight, ink) => {
  const t = tone(atNight);
  const paint = t('red', 1);
  const [steel] = metal(atNight);
  return (
    `<path d="M57 28L75 6" stroke="${t('yellow', 1)}" stroke-width="8" stroke-linecap="round"/>` +
    `<path d="M52 35l6-8" stroke="${steel}" stroke-width="9"/>` +
    `<path d="M19 34v34c0 8 13 12 31 12s31-4 31-12V34z" fill="${main}"/>` +
    `<ellipse cx="50" cy="34" rx="32" ry="9" fill="${shade}"/>` +
    `<path d="M24 36h9v14a4.5 4.5 0 0 1-9 0zM67 38h8v7a4 4 0 0 1-8 0z" fill="${paint}"/>` +
    `<ellipse cx="50" cy="34" rx="27" ry="6" fill="${paint}"/>` +
    `<rect x="25" y="56" width="5" height="14" rx="2.5" fill="${shine(atNight)}" fill-opacity=".5"/>` +
    face(50, 52, ink)
  );
};

/** A smiling wax crayon standing on its end: tall and narrow, like a balloon. */
const crayon: Draw = ([main, shade], atNight, ink) =>
  `<g transform="rotate(8 50 50)">` +
  `<path d="M37 34L45 12q5-8 10 0l8 22z" fill="${shade}"/>` +
  `<rect x="34" y="30" width="32" height="62" rx="7" fill="${main}"/>` +
  `<path d="M34 36h32v7H34zM34 79h32v7H34z" fill="${shade}"/>` +
  `<rect x="38" y="47" width="4.5" height="27" rx="2.2" fill="${shine(atNight)}" fill-opacity=".55"/>` +
  face(51, 57, ink) +
  `</g>`;

/** A paintbrush sweeping a wavy stroke of blue paint. */
const paintbrush: Draw = ([main, shade], atNight) => {
  const t = tone(atNight);
  const paint = t('blue', atNight ? 0 : 1);
  const [steel, steelShade] = metal(atNight);
  return (
    `<path d="M10 86c8-8 14-8 20-3s12 5 18-2 12-6 18-1" fill="none" stroke="${paint}" stroke-width="7" stroke-linecap="round"/>` +
    `<g transform="rotate(-40 50 50)">` +
    `<path d="M6 50q12-9 26-8v16q-14 1-26-8z" fill="${paint}"/>` +
    `<rect x="31" y="42" width="15" height="16" rx="2" fill="${steel}"/><path d="M38 42v16" stroke="${steelShade}" stroke-width="3"/>` +
    `<path d="M46 44l40 2a4 4 0 0 1 0 8l-40 2z" fill="${main}"/><path d="M52 46.5l30 1.5" stroke="${shine(atNight)}" stroke-width="2.5" stroke-linecap="round" stroke-opacity=".6"/>` +
    `<path d="M74 45.4v9.2" stroke="${shade}" stroke-width="4"/>` +
    `</g>`
  );
};

/** A chunky star coloured in with a crayon scribble (kept inside the lines): bold enough to read while it spins. */
const star: Draw = ([main, shade]) => {
  const outline = 'M50 8l12 25 27 4-20 19 5 27-24-13-24 13 5-27-20-19 27-4z';
  return (
    `<clipPath id="inside"><path d="${outline}"/></clipPath>` +
    `<path d="${outline}" fill="${main}" stroke="${main}" stroke-width="8" stroke-linejoin="round"/>` +
    `<path d="M10 44L44 18 20 58 60 24 30 72 74 36 46 76 86 42" fill="none" stroke="${shade}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" clip-path="url(#inside)"/>`
  );
};

/** An open box of crayons: red, yellow and blue poking out of a box with a zigzag band. */
const crayonBox: Draw = ([main, shade], atNight) => {
  const t = tone(atNight);
  const stick = (x: number, top: number, colour: Colour) =>
    `<path d="M${x + 2} ${top}l4.5-11q2.5-4 5 0l4.5 11z" fill="${t(colour, 1)}"/>` +
    `<rect x="${x}" y="${top}" width="18" height="40" rx="3" fill="${t(colour)}"/>` +
    `<rect x="${x}" y="${top + 5}" width="18" height="5" fill="${t(colour, 1)}"/>`;
  return (
    stick(23, 26, 'red') +
    stick(41, 19, 'yellow') +
    stick(59, 28, 'blue') +
    `<path d="M18 46h64l-4 40c-.4 4-3 6-7 6H29c-4 0-6.6-2-7-6z" fill="${main}"/>` +
    `<rect x="15" y="42" width="70" height="10" rx="5" fill="${shade}"/>` +
    `<path d="M26 72l8-7 8 7 8-7 8 7 8-7 8 7" fill="none" stroke="${shade}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<rect x="25" y="56" width="5" height="10" rx="2.5" fill="${shine(atNight)}" fill-opacity=".6"/>`
  );
};

/** Children's craft scissors: round coloured handles and two short silver blades with blunt, rounded tips. */
const scissors: Draw = ([main, shade], atNight) => {
  const [steel, steelShade] = metal(atNight);
  return (
    `<g transform="rotate(-12 50 50)">` +
    `<path d="M57 55L37 15 47 61zM43 55L63 15 53 61z" fill="${steel}" stroke="${steel}" stroke-width="9" stroke-linejoin="round"/>` +
    `<path d="M39 22l9 20M61 22L52 42" stroke="${steelShade}" stroke-width="2.5" stroke-linecap="round"/>` +
    `<path d="M53 56l9 11M47 56l-9 11" stroke="${main}" stroke-width="9" stroke-linecap="round"/>` +
    `<ellipse cx="34" cy="76" rx="12" ry="10" fill="none" stroke="${main}" stroke-width="8"/>` +
    `<ellipse cx="66" cy="76" rx="12" ry="10" fill="none" stroke="${main}" stroke-width="8"/>` +
    `<circle cx="50" cy="52" r="4.5" fill="${shade}"/>` +
    `</g>`
  );
};

/**
 * A smiling bottle of school glue: round shoulders narrowing into a neck, an orange twist cap with a
 * tall pointed nozzle, and white glue oozing from the tip and running down the bottle.
 */
const glue: Draw = ([main, shade], atNight, ink) => {
  const t = tone(atNight);
  const goo = shine(atNight);
  return (
    `<path d="M42 38h16v3c0 6 13 7 13 17v26c0 5-4 8-9 8H38c-5 0-9-3-9-8V58c0-10 13-11 13-17z" fill="${main}"/>` +
    `<rect x="34" y="63" width="32" height="21" rx="6" fill="${shade}"/>` +
    `<rect x="33" y="50" width="4.5" height="9" rx="2.2" fill="${goo}" fill-opacity=".55"/>` +
    // The twist cap: a ridged collar and a tall pointed nozzle.
    `<rect x="38" y="29" width="24" height="11" rx="3" fill="${t('orange', 1)}"/>` +
    `<path d="M43.5 32v5M50 32v5M56.5 32v5" stroke="${t('orange')}" stroke-width="2.5" stroke-linecap="round"/>` +
    `<path d="M44 30L48.5 9q1.5-4 3 0L56 30z" fill="${t('orange')}"/>` +
    // Glue: a bead oozing from the tip, and a drip running from the cap down the shoulder.
    `<path d="M47 8.5q3-5 6 0v1.5c0 2-1 3-1 5v3a2 2 0 0 1-4 0v-3c0-2-1-3-1-5z" fill="${goo}"/>` +
    `<path d="M57 40c1 4 5 6 5 11" fill="none" stroke="${goo}" stroke-width="5" stroke-linecap="round"/><circle cx="62" cy="53.5" r="4.5" fill="${goo}"/>` +
    face(50, 70, ink)
  );
};

/** A wooden easel holding a painting of a sun over green hills on a sky-blue canvas. */
const easel: Draw = ([main, shade], atNight) => {
  const t = tone(atNight);
  return (
    `<path d="M50 10v80" stroke="${t('orange', 1)}" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M45 12L25 92M55 12l20 80" stroke="${t('orange')}" stroke-width="6" stroke-linecap="round"/>` +
    `<circle cx="50" cy="10" r="5" fill="${t('orange', 1)}"/>` +
    `<rect x="20" y="18" width="60" height="44" rx="4" fill="${main}" stroke="${shade}" stroke-width="4"/>` +
    `<circle cx="63" cy="32" r="7" fill="${t('yellow', 1)}"/>` +
    `<path d="M22 60V50c7-7 15-8 22-3s14 4 20-1 11-4 14-2v16z" fill="${t('green', 1)}"/>` +
    `<rect x="14" y="62" width="72" height="7" rx="3.5" fill="${t('orange', 1)}"/>`
  );
};

/** A sharpened pencil with a pink eraser, drawing a loopy line. */
const pencil: Draw = ([main, shade], atNight) => {
  const [steel] = metal(atNight);
  return (
    `<path d="M8 88c6-10 12-12 12-6s-6 8 0 8 12-10 18-8" fill="none" stroke="${shade}" stroke-width="3.5" stroke-linecap="round"/>` +
    `<g transform="rotate(-45 50 50)">` +
    `<path d="M88 41a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4h-6V41z" fill="${tone(atNight)('red')}"/>` +
    `<rect x="74" y="41" width="9" height="18" fill="${steel}"/>` +
    `<rect x="28" y="41" width="46" height="18" fill="${main}"/><rect x="28" y="47" width="46" height="6" fill="${shade}"/>` +
    `<path d="M28 41L8 50l20 9z" fill="${wood(atNight)}"/><path d="M14 47.3L8 50l6 2.7z" fill="${shade}"/>` +
    `</g>`
  );
};

const make = (draw: Draw, colour: Colour): Doodle =>
  doodle((colors, atNight) => draw(colors, atNight, faces[colour][atNight ? 1 : 0]), pastel[colour], night[colour]);

/** A scribbly crayon zigzag under the title: thirteen strokes, uneven like a child's hand, inside the 2.5–9.5 band. */
const zigzag = 'M2 7.5L10 3.5 19.5 8.8 27.5 4.2 38 9 47 3 55 7.8 65.5 3.8 74.5 8.6 83 4.6 93 9 102 3.4 110 8.2 118 4.8';

export const crayonDoodles: ThemeDoodles = {
  home: [make(palette, 'yellow'), make(paintPot, 'blue'), make(crayon, 'red'), make(paintbrush, 'green')],
  page: [make(palette, 'yellow'), make(star, 'orange'), make(crayon, 'red')],
  sections: [
    make(crayonBox, 'green'),
    make(scissors, 'red'),
    make(glue, 'purple'),
    make(easel, 'blue'),
    make(pencil, 'yellow'),
    make(star, 'purple'),
  ],
  underline: zigzag,
};
