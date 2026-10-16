// Ocean Breeze: a breezy seaside set (whale, round fish, jellyfish, sailboat, starfish, octopus,
// scallop shell, turtle, crab) in aqua, periwinkle and coral, with round, bubbly shapes. Soft pastels
// by day; at night, clearer mid-tones that glow on the deep-sea page (dimmed pastels turn grey).
import { type Doodle, type ThemeDoodles } from './shared';

type Tone = 'aqua' | 'sea' | 'periwinkle' | 'coral' | 'shell' | 'seafoam';

/**
 * Main colour, a shade for details, and a deep shade of the same hue for faces (eyes, smiles), picked
 * so every face stands out from its body by about the same amount: about 2.3:1 by day (as soft as the
 * Pastel and Meadow faces) and 4:1 at night. The turtle's face sits on its head, which is the shade.
 */
type Paints = [string, string, string];

/** Pastel enough to sit quietly behind text. */
const pastel = {
  aqua: ['#b8ecf5', '#90dcea', '#2ea4ba'],
  sea: ['#c2d8ff', '#a3c2fd', '#5f8ad9'],
  periwinkle: ['#d2d4ff', '#b9bbff', '#7f82e2'],
  coral: ['#ffcbbd', '#ffae99', '#d96d55'],
  shell: ['#ffcfdc', '#ffb3c8', '#db6e8c'],
  seafoam: ['#bdeedb', '#9be2c6', '#2a9c70'],
} satisfies Record<Tone, Paints>;

/**
 * The night versions of the pastels: more colour, less light, so they glow on the dark sea. Coral leans
 * pink and the shell is a light pink, so at the margin doodles' 60% they still read as coral and pink
 * rather than brick and mauve.
 */
const night = {
  aqua: ['#5cd6ea', '#36b9d1', '#1c6370'],
  sea: ['#6fa6f5', '#5288e6', '#1f417c'],
  periwinkle: ['#8e98ff', '#7279f2', '#292fa3'],
  coral: ['#ff8a8a', '#f46c74', '#892228'],
  shell: ['#ffb4ca', '#fc8fb1', '#a92a52'],
  seafoam: ['#4dd2a6', '#30b78b', '#134b39'],
} satisfies Record<Tone, Paints>;

/** All the tones by day or at night, for a doodle that borrows another tone (the sailboat's hull). */
const tones = (atNight: boolean): Record<Tone, Paints> => (atNight ? night : pastel);

/** Draws a doodle from its tone's paints ([main, shade, face]), by day or at night. */
type Draw = (paints: Paints, atNight: boolean) => string;

/** Soft highlights: white by day, a pale aqua tint at night. */
const shine = (atNight: boolean) => (atNight ? '#d6eef7' : '#fff');

/** Computed points: one on an oval round (cx, cy) at an angle, and its "x y" rounded to one decimal. */
type Point = [number, number];
const onOval = (cx: number, cy: number, rx: number, ry: number, deg: number): Point => [
  cx + rx * Math.cos((deg * Math.PI) / 180),
  cy + ry * Math.sin((deg * Math.PI) / 180),
];
const r1 = (v: number) => String(Math.round(v * 10) / 10);
const xy = ([x, y]: Point) => `${r1(x)} ${r1(y)}`;

/** A smiling whale, wide and low, blowing a little spout. */
const whale: Draw = ([main, shade, face], atNight) => {
  const spout = tones(atNight).aqua[1];
  return (
    `<path d="M32 37v-9M32 28c-3-5-8-6-11-3M32 28c3-5 8-6 11-3" fill="none" stroke="${spout}" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M10 60c0-15 13-23 30-23 15 0 24 8 30 16 3-6 5-11 6-16h8c0 9-3 19-10 28-8 7-20 10-34 10-18 0-30-4-30-15z" fill="${main}"/>` +
    `<path d="M80 40c-5-2-11-7-12-14 6-1 10 2 12 6 2-4 6-7 12-6-1 7-7 12-12 14z" fill="${shade}"/>` +
    `<path d="M40 64c4 6 12 8 17 4-2-6-11-8-17-4z" fill="${shade}"/>` +
    `<path d="M14 66c9 5 27 7 42 5-5 3-10 4-16 4-13 0-22-3-26-9z" fill="${shine(atNight)}" fill-opacity=".45"/>` +
    `<ellipse cx="38" cy="44" rx="8" ry="4" transform="rotate(-12 38 44)" fill="${shine(atNight)}" fill-opacity=".5"/>` +
    `<circle cx="24" cy="54" r="3.2" fill="${face}"/>` +
    `<path d="M19 61c3 3 8 3 11 0" fill="none" stroke="${face}" stroke-width="3" stroke-linecap="round"/>`
  );
};

/** A round, bubbly fish swimming to the left. */
const fish: Draw = ([main, shade, face], atNight) =>
  `<path d="M70 52l20-20c4 13 4 27 0 40z" fill="${shade}" stroke="${shade}" stroke-width="5" stroke-linejoin="round"/>` +
  `<path d="M32 28c6-12 22-12 28 2z" fill="${shade}"/>` +
  `<ellipse cx="42" cy="52" rx="32" ry="28" fill="${main}"/>` +
  `<path d="M41 36c6.5 9 6.5 23 0 32" fill="none" stroke="${shade}" stroke-width="5" stroke-linecap="round"/>` +
  `<path d="M50 59c8-3 15 2 14 10-7 0-11-4-14-10z" fill="${shade}"/>` +
  `<ellipse cx="30" cy="35" rx="8" ry="4.5" transform="rotate(-20 30 35)" fill="${shine(atNight)}" fill-opacity=".5"/>` +
  `<circle cx="26" cy="47" r="4.5" fill="${face}"/><circle cx="27.5" cy="45.5" r="1.5" fill="${shine(atNight)}"/>` +
  `<path d="M17 60c3 3 8 3 11 0" fill="none" stroke="${face}" stroke-width="3" stroke-linecap="round"/>`;

/** A smiling jellyfish with a scalloped bell and wavy tentacles: tall and narrow, like a balloon. */
const jellyfish: Draw = ([main, shade, face], atNight) => {
  const tentacle = (x: number, length: number) => `M${x} 50c-5 7 5 13 0 20s5 13 0 ${length}`;
  return (
    `<path d="${[tentacle(33, 18), tentacle(44, 24), tentacle(56, 22), tentacle(67, 16)].join('')}" fill="none" stroke="${shade}" stroke-width="5.5" stroke-linecap="round"/>` +
    `<path d="M24 46c0-20 12-34 26-34s26 14 26 34q-6.5 8-13 0-6.5 8-13 0-6.5 8-13 0-6.5 8-13 0z" fill="${main}"/>` +
    `<ellipse cx="36" cy="25" rx="5" ry="8" transform="rotate(30 36 25)" fill="${shine(atNight)}" fill-opacity=".5"/>` +
    `<circle cx="42" cy="34" r="3" fill="${face}"/><circle cx="58" cy="34" r="3" fill="${face}"/>` +
    `<path d="M45 40c3 3 7 3 10 0" fill="none" stroke="${face}" stroke-width="3" stroke-linecap="round"/>`
  );
};

/** A little sailboat on a wave: aqua sails, a coral hull. */
const sailboat: Draw = ([main, shade], atNight) => {
  const [hull, hullShade] = tones(atNight).coral;
  return (
    `<rect x="46" y="10" width="5" height="58" rx="2.5" fill="${hullShade}"/>` +
    `<path d="M51 10l11 4-11 4z" fill="${hull}"/>` +
    `<path d="M44 16c-8 15-18 31-28 46h28z" fill="${main}"/>` +
    `<path d="M53 24c9 12 17 25 23 38H53z" fill="${shade}"/>` +
    `<path d="M10 66h80c-3 12-11 20-24 20H34c-13 0-21-8-24-20z" fill="${hull}"/>` +
    `<path d="M24 74h52" stroke="${shine(atNight)}" stroke-width="3" stroke-linecap="round" stroke-opacity=".6"/>` +
    `<path d="M8 91c7-4 14-4 21 0s14 4 21 0 14-4 21 0 14 4 21 0" fill="none" stroke="${shade}" stroke-width="3.5" stroke-linecap="round"/>`
  );
};

/** A chubby starfish with speckles: bold and round enough to read while it spins. */
const starfish: Draw = ([main], atNight) => {
  // Five arm tips and the dips between them; a thick round-joined stroke makes the arms chubby.
  const arms = [0, 1, 2, 3, 4];
  const points = arms.flatMap((i) => [xy(onOval(50, 52, 39, 39, -90 + 72 * i)), xy(onOval(50, 52, 18, 18, -54 + 72 * i))]);
  const dots = arms
    .map((i) => onOval(50, 52, 23, 23, -90 + 72 * i))
    .map(([x, y]) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="3"/>`)
    .join('');
  return (
    `<path d="M${points.join('L')}z" fill="${main}" stroke="${main}" stroke-width="11" stroke-linejoin="round"/>` +
    `<g fill="${shine(atNight)}" fill-opacity=".55">${dots}<circle cx="50" cy="52" r="4"/></g>`
  );
};

/** A smiling octopus with curly legs and a spotty head. */
const octopus: Draw = ([main, shade, face], atNight) =>
  `<path d="M30 56c-3 12-10 18-17 16-3-1-3-5 0-6M42 60c-1 12-5 20-12 23-3 1-5-2-3-5M58 60c1 12 5 20 12 23 3 1 5-2 3-5M70 56c3 12 10 18 17 16 3-1 3-5 0-6" fill="none" stroke="${main}" stroke-width="9" stroke-linecap="round"/>` +
  `<path d="M22 42c0-18 13-29 28-29s28 11 28 29c0 10-4 18-10 20H32c-6-2-10-10-10-20z" fill="${main}"/>` +
  `<g fill="${shade}"><circle cx="61" cy="23" r="4"/><circle cx="69" cy="33" r="2.5"/><circle cx="53" cy="19" r="2"/></g>` +
  `<ellipse cx="34" cy="26" rx="5" ry="8" transform="rotate(40 34 26)" fill="${shine(atNight)}" fill-opacity=".5"/>` +
  `<circle cx="41" cy="42" r="3.4" fill="${face}"/><circle cx="59" cy="42" r="3.4" fill="${face}"/>` +
  `<path d="M44 50c3 3.5 9 3.5 12 0" fill="none" stroke="${face}" stroke-width="3" stroke-linecap="round"/>`;

/** A scallop shell: a ribbed fan with a bumpy edge and little hinge wings. */
const shell: Draw = ([main, shade], atNight) => {
  // Six points round the top of an oval, with a bump pushed outwards between each pair, and ribs
  // fanning out from the hinge to the four inner points.
  const rim = [180, 216, 252, 288, 324, 360].map((deg) => onOval(50, 60, 38, 46, deg));
  const bumps = rim
    .slice(1)
    .map((p, i) => `Q${xy(onOval(50, 60, 43, 52, 198 + 36 * i))} ${xy(p)}`)
    .join('');
  const ribs = rim
    .slice(1, -1)
    .map(([x, y]) => `M50 80L${xy([50 + (x - 50) * 0.8, 80 + (y - 80) * 0.8])}`)
    .join('');
  return (
    `<path d="M38 78h24l5 10H33z" fill="${shade}" stroke="${shade}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M50 82L${xy(rim[0])}${bumps}z" fill="${main}" stroke="${main}" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="${ribs}" stroke="${shade}" stroke-width="3.5" stroke-linecap="round"/>` +
    `<ellipse cx="34" cy="34" rx="4" ry="7" transform="rotate(35 34 34)" fill="${shine(atNight)}" fill-opacity=".5"/>`
  );
};

/** A smiling sea turtle with a patterned shell, paddling with rounded flippers swept back. */
const turtle: Draw = ([main, shade, face], atNight) =>
  `<g fill="${shade}" stroke="${shade}" stroke-width="4" stroke-linejoin="round">` +
  `<path d="M64 66C63 78 52 86 36 88 42 83 46 76 48 66z"/><path d="M27 66C26 74 18 80 8 80 12 76 14 71 15 66z"/>` +
  `<path d="M64 58c6-6 10-10 18-10a11 11 0 0 1 0 22c-6 0-10-3-14-6z" stroke="none"/></g>` +
  `<path d="M12 64c0-21 13-35 30-35s30 14 30 35z" fill="${main}"/>` +
  `<rect x="8" y="60" width="68" height="9" rx="4.5" fill="${shade}"/>` +
  `<path d="M42 37l9 5v10l-9 5-9-5V42zM42 37v-8M51 52l7 8M33 52l-7 8M51 42l10-5M33 42l-10-5" fill="none" stroke="${shade}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>` +
  `<circle cx="84" cy="56" r="2.6" fill="${face}"/>` +
  `<path d="M80 63c2.5 2 6 2 8 0" fill="none" stroke="${face}" stroke-width="2.6" stroke-linecap="round"/>`;

/** A happy crab waving its claws, eyes up on stalks. */
const crab: Draw = ([main, shade, face], atNight) => {
  const eyeWhite = atNight ? '#ffe9e3' : '#fff';
  return (
    `<path d="M26 62l-12 4M26 69l-10 9M74 62l12 4M74 69l10 9M42 46V31M58 46V31M26 46l-6-6M74 46l6-6" fill="none" stroke="${shade}" stroke-width="4.5" stroke-linecap="round"/>` +
    `<path d="M18 36l-4.3-10.3A11.5 11.5 0 1 0 22.3 25.7zM82 36l-4.3-10.3A11.5 11.5 0 1 0 86.3 25.7z" fill="${main}"/>` +
    `<ellipse cx="50" cy="60" rx="30" ry="20" fill="${main}"/>` +
    `<ellipse cx="38" cy="53" rx="8" ry="4" transform="rotate(-15 38 53)" fill="${shine(atNight)}" fill-opacity=".5"/>` +
    `<circle cx="42" cy="28" r="5.5" fill="${eyeWhite}"/><circle cx="58" cy="28" r="5.5" fill="${eyeWhite}"/>` +
    `<circle cx="42.5" cy="29" r="2.8" fill="${face}"/><circle cx="58.5" cy="29" r="2.8" fill="${face}"/>` +
    `<path d="M44 64c3 3.5 9 3.5 12 0" fill="none" stroke="${face}" stroke-width="3" stroke-linecap="round"/>`
  );
};

/** A doodle in one tone, by day and at night. */
const make = (draw: Draw, tone: Tone): Doodle => ({ day: draw(pastel[tone], false), night: draw(night[tone], true) });

/**
 * Little waves under the title: five round swells from x 2 to 118, drawn as ten half-waves (up, down,
 * up…) whose control points stay inside the 2.5–9.5 band, so the stroke is never clipped.
 */
const waves =
  'M2 6 C 6.2 2.5, 9.4 2.5, 13.6 6 ' +
  Array.from({ length: 9 }, (_, i) => {
    const x = 2 + 11.6 * (i + 2);
    return `S ${r1(x - 4.2)} ${i % 2 ? 2.5 : 9.5}, ${r1(x)} 6`;
  }).join(' ');

export const oceanDoodles: ThemeDoodles = {
  home: [make(whale, 'sea'), make(fish, 'coral'), make(jellyfish, 'periwinkle'), make(sailboat, 'aqua')],
  page: [make(whale, 'sea'), make(starfish, 'coral'), make(jellyfish, 'periwinkle')],
  sections: [make(octopus, 'periwinkle'), make(shell, 'shell'), make(turtle, 'seafoam'), make(sailboat, 'aqua'), make(crab, 'coral'), make(starfish, 'sea')],
  underline: waves,
};
