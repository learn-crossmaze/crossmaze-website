// Tropical Splash: a sunny island-holiday set (watermelon slice, hibiscus, pineapple, sea turtle,
// orange slice, palm tree, flamingo, monstera leaf, tender coconut, toucan) in coral, mango, lime and
// lagoon teal. Soft pastels by day; at night, clearer mid-tones that glow on the dark lagoon page
// (dimmed pastels turn grey or khaki).
import { type Colors, type Doodle, type ThemeDoodles, doodle } from './shared';

/** Pastel enough to sit quietly behind text. */
const pastel = {
  coral: ['#ffc3ba', '#ffa597'],
  hibiscus: ['#ffbcd5', '#ff9ebf'],
  /** Flamingo pink: warmer than the hibiscus, with less blue in it. */
  flamingo: ['#ffbfcf', '#ffa2b9'],
  mango: ['#ffe08c', '#ffcb57'],
  /** A toucan's throat and beak. */
  beak: ['#ffe08c', '#ffcb57'],
  orange: ['#ffd0a8', '#ffb57f'],
  lime: ['#d3f0a2', '#b6e277'],
  /** A tender coconut: a deeper green than the lime, so the shell reads on the lime-tinted page. */
  coconut: ['#b4e07f', '#97cf5c'],
  jade: ['#ade9dc', '#86dac8'],
  /** The monstera: a step deeper than jade, so it still shows on the mint stretch of the page. */
  leaf: ['#8ad8c4', '#5abda5'],
  lagoon: ['#9fd8f7', '#77c4ee'],
  /** Island sand, then palm bark. */
  sand: ['#ffe7bf', '#f5c993'],
  /** Coconuts on the palm: the front one, then the one behind. */
  nut: ['#e6ad78', '#dc9c64'],
} satisfies Record<string, Colors>;

/**
 * The night versions of the pastels: more colour, less light, so they glow on the dark lagoon. Warm
 * colours lean orange rather than yellow here, because yellows turn mustard on the green night page.
 */
const night = {
  coral: ['#ff9182', '#f56e5f'],
  hibiscus: ['#ff8ec8', '#fb66a8'],
  flamingo: ['#ff8fa8', '#f86d8e'],
  mango: ['#ffc94d', '#f2ab26'],
  beak: ['#ffc061', '#ff9f3f'],
  orange: ['#ffa86a', '#f78a4c'],
  lime: ['#a2df60', '#82c540'],
  coconut: ['#a2df60', '#82c540'],
  jade: ['#55dcc3', '#31bea6'],
  leaf: ['#55dcc3', '#31bea6'],
  lagoon: ['#5cc4f2', '#36a6de'],
  sand: ['#ffcb6b', '#f5aa5c'],
  nut: ['#f78a4c', '#ec7442'],
} satisfies Record<keyof typeof pastel, Colors>;

type Colour = keyof typeof pastel;
type Draw = (colors: Colors, atNight: boolean) => string;

/** The palette by day or at night, for a doodle's fixed details (leaves, rinds, beaks…). */
const tones = (atNight: boolean) => (atNight ? night : pastel);

/** Soft highlights: white by day, a pale lagoon tint at night (pure white glares on the dark page). */
const shine = (atNight: boolean) => (atNight ? '#dff3ee' : '#fff');

/** A face colour (eyes, smiles): the doodle's own hue, deeper and richer, never black. */
function deep(hex: string, atNight: boolean): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  const hue = d === 0 ? 0 : max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  const [s, l] = atNight ? [0.6, 0.27] : [0.55, 0.45];
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

/** Numbers rounded to one decimal, and the point at `deg` degrees on a circle round (cx, cy) as "x y". */
const r1 = (v: number) => String(Math.round(v * 10) / 10);
const at = (cx: number, cy: number, r: number, deg: number) =>
  `${r1(cx + r * Math.cos((deg * Math.PI) / 180))} ${r1(cy + r * Math.sin((deg * Math.PI) / 180))}`;

/**
 * A path turned `deg` degrees round (cx, cy). The path must use absolute commands whose numbers all
 * come in x y pairs (M, L, C, S, Q, T, Z), so every point turns. Turning the points rather than
 * wrapping the drawing in a rotate() keeps its ink box tight.
 */
const turn = (d: string, deg: number, cx = 50, cy = 50) => {
  const [cos, sin] = [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
  return d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => {
    const [dx, dy] = [Number(x) - cx, Number(y) - cy];
    return `${r1(cx + dx * cos - dy * sin)} ${r1(cy + dx * sin + dy * cos)}`;
  });
};

/** A path mirrored left to right (absolute x y pairs only, like `turn`). */
const flip = (d: string) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${r1(100 - Number(x))} ${y}`);

/** An oval as a path (four curves), so `turn` can turn it too. */
const oval = (cx: number, cy: number, rx: number, ry: number) => {
  const [kx, ky] = [rx * 0.552, ry * 0.552];
  const p = (x: number, y: number) => `${r1(x)} ${r1(y)}`;
  return (
    `M${p(cx - rx, cy)}C${p(cx - rx, cy - ky)} ${p(cx - kx, cy - ry)} ${p(cx, cy - ry)}` +
    `C${p(cx + kx, cy - ry)} ${p(cx + rx, cy - ky)} ${p(cx + rx, cy)}` +
    `C${p(cx + rx, cy + ky)} ${p(cx + kx, cy + ry)} ${p(cx, cy + ry)}` +
    `C${p(cx - kx, cy + ry)} ${p(cx - rx, cy + ky)} ${p(cx - rx, cy)}z`
  );
};

/** A smiling watermelon slice, wide and low, like a cloud. */
const watermelon: Draw = ([main, shade], atNight) => {
  const t = tones(atNight);
  const face = deep(shade, atNight);
  // Drawn flat side up, then tipped 12° so its straight edge doesn't look cut off.
  const tilt = (d: string) => turn(d, -12, 50, 46);
  const half = (r: number) => {
    const [left, right] = [tilt(`${50 - r} 28`), tilt(`${50 + r} 28`)];
    return `M${left}L${right}A${r} ${r} 0 0 1 ${left}z`;
  };
  const seeds = [
    [28, 35, 60],
    [72, 35, -60],
    [37, 50, 35],
    [63, 50, -35],
  ]
    .map(([x, y, a]) => turn(oval(x, y, 1.8, 3.2), a, x, y))
    .join('');
  const eyes = [tilt('42 37'), tilt('58 37')].map((xy) => xy.split(' ')).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3"/>`).join('');
  return (
    `<path d="${half(40)}" fill="${t.lime[1]}"/><path d="${half(35)}" fill="${tint(t.lime[0], atNight ? 0.35 : 0.55)}"/>` +
    `<path d="${half(31)}" fill="${main}"/>` +
    `<g fill="${face}"><path d="${tilt(seeds)}"/>${eyes}</g>` +
    `<path d="${tilt('M45 43C48 46 52 46 55 43')}" fill="none" stroke="${face}" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="${tilt('M24 33C25 39 28 44 32 48')}" fill="none" stroke="${shine(atNight)}" stroke-width="3.5" stroke-linecap="round" stroke-opacity=".5"/>`
  );
};

/**
 * A hibiscus: five broad, barely dipped petals round a deep throat, with its long thick stamen tipped
 * with pollen (the stamen is what says "hibiscus" rather than any pink flower).
 */
const hibiscus: Draw = ([main, shade], atNight) => {
  const t = tones(atNight);
  const petal = 'M50 52C38 44 27 31 31 19 35 9 44 7.5 50 9 56 7.5 65 9 69 19 73 31 62 44 50 52z';
  const angles = [0, 72, 144, 216, 288];
  return (
    `<path d="${angles.map((a) => turn(petal, a)).join('')}" fill="${main}"/>` +
    `<path d="${angles.map((a) => `M${at(50, 50, 9, a - 90)}L${at(50, 50, 25, a - 90)}`).join('')}" stroke="${shade}" stroke-width="3.5" stroke-linecap="round"/>` +
    `<circle cx="50" cy="50" r="11" fill="${shade}"/>` +
    `<path d="${turn(oval(36, 22, 5, 8), -30, 36, 22)}" fill="${shine(atNight)}" fill-opacity=".5"/>` +
    `<path d="M50 50Q61 43 67 29" fill="none" stroke="${t.mango[1]}" stroke-width="6.5" stroke-linecap="round"/>` +
    `<g fill="${t.mango[1]}"><circle cx="68" cy="24" r="4.5"/><circle cx="75" cy="29" r="4"/><circle cx="61" cy="22" r="4"/></g>`
  );
};

/**
 * The crossing lines of a pineapple's skin: chords of an oval (cx, cy, rx, ry) running at ±45°,
 * `gap` apart along the middle, each clipped to the oval so the pattern never spills over.
 */
function hatch(cx: number, cy: number, rx: number, ry: number, gap: number): string {
  const lines: string[] = [];
  for (const dy of [1, -1]) {
    for (let k = -4; k <= 4; k++) {
      const [px, py] = [cx + k * gap, cy];
      const a = 1 / rx ** 2 + dy ** 2 / ry ** 2;
      const b = (2 * (px - cx)) / rx ** 2;
      const c = (px - cx) ** 2 / rx ** 2 - 1;
      const disc = b * b - 4 * a * c;
      if (disc <= 0) continue;
      const [t1, t2] = [-1, 1].map((s) => (-b + s * Math.sqrt(disc)) / (2 * a));
      lines.push(`M${r1(px + t1)} ${r1(py + dy * t1)}L${r1(px + t2)} ${r1(py + dy * t2)}`);
    }
  }
  return lines.join('');
}

/** A smiling pineapple with a spiky leafy crown: tall and narrow, like a balloon. */
const pineapple: Draw = ([main, shade], atNight) => {
  const t = tones(atNight);
  const face = deep(shade, atNight);
  // Spiky leaves fanning out from the top of the fruit: the outer pair darker, behind.
  const leaf = (len: number, deg: number) =>
    turn(`M45 42C44 ${r1(42 - len * 0.4)} 47 ${r1(42 - len * 0.75)} 50 ${42 - len} 53 ${r1(42 - len * 0.75)} 56 ${r1(42 - len * 0.4)} 55 42z`, deg, 50, 42);
  return (
    `<path d="${leaf(26, -50)}${leaf(26, 50)}" fill="${t.lime[1]}"/>` +
    `<path d="${leaf(32, -24)}${leaf(32, 24)}${leaf(36, 0)}" fill="${t.lime[0]}"/>` +
    `<ellipse cx="50" cy="65" rx="23" ry="28" fill="${main}"/>` +
    `<path d="${hatch(50, 65, 20, 25, 13)}" stroke="${shade}" stroke-width="2.5" stroke-linecap="round"/>` +
    `<path d="${turn(oval(38, 52, 4, 7), 25, 38, 52)}" fill="${shine(atNight)}" fill-opacity=".5"/>` +
    `<g fill="${face}"><circle cx="43" cy="66" r="3"/><circle cx="57" cy="66" r="3"/></g>` +
    `<path d="M46 72c2.5 2.5 5.5 2.5 8 0" fill="none" stroke="${face}" stroke-width="3" stroke-linecap="round"/>`
  );
};

/** A smiling sea turtle seen from above, swimming up and to the right. */
const turtle: Draw = ([main, shade], atNight) => {
  const t = tones(atNight);
  const [skin, skinShade] = t.lime;
  const face = deep(skinShade, atNight);
  // Drawn heading straight up, then turned 40° to swim up and to the right.
  const tilt = (d: string) => turn(d, 40);
  const spot = (x: number, y: number) => tilt(`${x} ${y}`).split(' ');
  const flippers = 'M36 42C24 30 12 28 8 33 10 42 24 48 36 50zM38 66C30 68 25 76 27 82 33 83 40 77 43 71z';
  // The shell's plates: a hexagon in the middle and six seams out to the rim.
  const hex = [0, 1, 2, 3, 4, 5].map((i) => at(50, 52, 9, -90 + 60 * i));
  const seams = [0, 1, 2, 3, 4, 5].map((i) => `M${hex[i]}L${at(50, 52, 23, -90 + 60 * i)}`).join('');
  const [hx, hy] = spot(50, 21);
  const eyes = [spot(45.5, 18), spot(54.5, 18)].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.3"/>`).join('');
  return (
    `<path d="${tilt(`${flippers}${flip(flippers)}M46 74L50 86 54 74z`)}" fill="${skinShade}"/>` +
    `<circle cx="${hx}" cy="${hy}" r="10.5" fill="${skin}"/>` +
    `<path d="${tilt(oval(50, 52, 23, 27))}" fill="${main}"/>` +
    `<path d="${tilt(`M${hex.join('L')}z${seams}`)}" fill="${shade}" stroke="${shade}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>` +
    `<path d="${tilt(oval(39, 38, 3.5, 6.5))}" fill="${shine(atNight)}" fill-opacity=".5"/>` +
    `<g fill="${face}">${eyes}</g>` +
    `<path d="${tilt('M46.5 23.5C48.5 25.3 51.5 25.3 53.5 23.5')}" fill="none" stroke="${face}" stroke-width="2.2" stroke-linecap="round"/>`
  );
};

/** A citrus slice, round and segmented: it reads at 32px and looks good spinning. */
const citrus: Draw = ([main, shade], atNight) => {
  const pith = tint(main, atNight ? 0.45 : 0.6);
  const spokes = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `M${at(50, 50, 6, 22.5 + 45 * i)}L${at(50, 50, 32, 22.5 + 45 * i)}`).join('');
  return (
    `<circle cx="50" cy="50" r="43" fill="${shade}"/><circle cx="50" cy="50" r="37" fill="${pith}"/>` +
    `<circle cx="50" cy="50" r="33" fill="${main}"/>` +
    `<path d="${spokes}" stroke="${pith}" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="50" r="6" fill="${pith}"/>` +
    `<path d="M${at(50, 50, 39.5, 200)}A39.5 39.5 0 0 1 ${at(50, 50, 39.5, 245)}" fill="none" stroke="${shine(atNight)}" stroke-width="3" stroke-linecap="round" stroke-opacity=".6"/>`
  );
};

/** A palm tree with coconuts on a little sandy island. */
const palm: Draw = ([main, shade], atNight) => {
  const t = tones(atNight);
  const [sand, bark] = t.sand;
  const [nut, nutBehind] = t.nut;
  return (
    `<path d="M14 92C22 80 78 80 86 92z" fill="${sand}"/>` +
    `<path d="M56 88C58 70 54 50 46 32" fill="none" stroke="${bark}" stroke-width="8" stroke-linecap="round"/>` +
    `<g fill="${shade}"><path d="M46 30C38 15 22 9 12 15 24 17 36 23 46 30zM46 30C54 14 70 8 84 13 70 15 58 21 46 30z"/></g>` +
    `<g fill="${main}"><path d="M46 30C34 18 14 20 8 40 18 32 32 30 46 30zM46 30C60 18 82 20 92 40 80 32 64 30 46 30z"/></g>` +
    `<circle cx="42" cy="36" r="5.5" fill="${nutBehind}"/><circle cx="52" cy="37" r="5.5" fill="${nut}"/>`
  );
};

/** A flamingo standing on one leg. */
const flamingo: Draw = ([main, shade], atNight) => {
  const face = deep(shade, atNight);
  return (
    `<path d="M58 62V92M58 92h-8M60 62l10 12-11 3" fill="none" stroke="${shade}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M40 50C30 44 28 34 34 26 40 18 38 10 30 11" fill="none" stroke="${main}" stroke-width="7" stroke-linecap="round"/>` +
    `<path d="M38 52C40 40 56 36 70 38 78 38 86 32 88 30 86 42 80 52 70 58 58 66 40 64 38 52z" fill="${main}"/>` +
    `<circle cx="31" cy="12" r="7" fill="${main}"/>` +
    `<path d="M46 50C54 42 66 42 76 44 70 52 56 56 46 50z" fill="${shade}"/>` +
    `<path d="M25 10C19 12 16 18 18 25 20 21 22 18 26 17z" fill="${shine(atNight)}"/>` +
    `<path d="M18 25C17 22 17.5 19 19 16.5 20 18 20.5 19.5 21 21z" fill="${face}"/>` +
    `<circle cx="31" cy="10.5" r="2" fill="${face}"/>`
  );
};

/** A monstera leaf with its split edges and holes, on a short stem, leaning to the left. */
const monstera: Draw = ([main, shade], atNight) => {
  const tilt = (d: string) => turn(d, -18);
  const leaf = 'M50 76C30 86 8 68 10 44 12 22 32 8 52 10 74 12 92 28 90 50 88 72 68 86 50 76z';
  // The splits run in from the edge towards the midrib; a mask cuts them (and two holes) out of the leaf.
  const slits = 'M10 46L32 48M14 28L36 36M28 13L42 28M14 64L34 58M88 52L66 50M84 32L64 38M68 13L58 28M84 68L64 60';
  return (
    `<mask id="m"><path d="M0 0h100v100H0z" fill="#fff"/><path d="${tilt(slits)}" stroke="#000" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="${tilt(oval(38, 58, 2.5, 4) + oval(62, 44, 2.5, 4))}"/></mask>` +
    `<path d="${tilt('M50 76L44 94')}" stroke="${shade}" stroke-width="5" stroke-linecap="round"/>` +
    `<g mask="url(#m)"><path d="${tilt(leaf)}" fill="${main}"/>` +
    `<path d="${tilt('M50 76C52 56 54 34 52 14')}" fill="none" stroke="${shade}" stroke-width="3.5" stroke-linecap="round"/></g>` +
    `<path d="${tilt(oval(32, 27, 3.5, 6.5))}" fill="${shine(atNight)}" fill-opacity=".45"/>`
  );
};

/** A tender coconut with a striped straw. */
const coconut: Draw = ([main, shade], atNight) => {
  const t = tones(atNight);
  const flesh = shine(atNight);
  return (
    `<path d="M56 44L64 14 76 10" fill="none" stroke="${t.coral[1]}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M56 44L64 14 76 10" fill="none" stroke="${flesh}" stroke-width="5" stroke-dasharray="3 5"/>` +
    `<path d="M24 44A30 30 0 1 0 72 44z" fill="${main}"/>` +
    `<ellipse cx="48" cy="44" rx="24" ry="7" fill="${flesh}"/><ellipse cx="48" cy="45" rx="18" ry="4.5" fill="${shade}"/>` +
    `<path d="M28 60c2 10 8 18 16 22" fill="none" stroke="${shine(atNight)}" stroke-width="4" stroke-linecap="round" stroke-opacity=".5"/>`
  );
};

/** A toucan with its big bright beak, perched on a branch. */
const toucan: Draw = ([main, shade], atNight) => {
  const t = tones(atNight);
  const face = deep(shade, atNight);
  return (
    `<path d="M12 84C40 79 62 80 88 76" fill="none" stroke="${t.sand[1]}" stroke-width="6" stroke-linecap="round"/>` +
    `<path d="M30 72L22 92 36 90 40 74z" fill="${shade}"/>` +
    `<path d="${turn(oval(40, 56, 18, 24), 14, 40, 56)}" fill="${main}"/>` +
    `<circle cx="46" cy="32" r="13" fill="${main}"/>` +
    `<ellipse cx="50" cy="44" rx="8" ry="10" fill="${t.beak[0]}"/>` +
    `<path d="M34 50C38 62 46 70 52 72 44 74 34 70 30 60z" fill="${shade}"/>` +
    `<path d="M55 25C70 18 88 22 94 34 84 37 66 40 56 38z" fill="${t.beak[1]}"/>` +
    `<path d="M80 22C88 25 92 29 94 34 89 35 84 36 80 36z" fill="${t.coral[1]}"/>` +
    `<circle cx="47" cy="29" r="5" fill="${tint(main, 0.5)}"/><circle cx="47.5" cy="29" r="2.6" fill="${face}"/>` +
    `<path d="M44 78l2 5M50 78l1 5" stroke="${t.sand[1]}" stroke-width="3" stroke-linecap="round"/>`
  );
};

const make = (draw: Draw, colour: Colour): Doodle => doodle(draw, pastel[colour], night[colour]);

/**
 * A splash under the title: a long smooth swoosh that breaks into little ripples at the end. Every
 * point stays inside the 2.5–9.5 band, so the stroke is never clipped.
 */
const splash = 'M2 7.5 C 22 3.5, 44 3.5, 64 7 C 72 8.5, 76 8.5, 80 6 S 88 2.5, 94 6 S 104 9.5, 110 6 S 116 3, 118 3';

export const tropicalDoodles: ThemeDoodles = {
  home: [make(watermelon, 'coral'), make(hibiscus, 'hibiscus'), make(pineapple, 'mango'), make(turtle, 'jade')],
  page: [make(watermelon, 'coral'), make(citrus, 'orange'), make(pineapple, 'mango')],
  sections: [make(palm, 'lime'), make(flamingo, 'flamingo'), make(monstera, 'leaf'), make(turtle, 'lagoon'), make(coconut, 'coconut'), make(toucan, 'jade')],
  underline: splash,
};
