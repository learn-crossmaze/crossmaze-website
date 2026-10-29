// Drawings for Sankranti, Holi, Ugadi, Good Friday, Ram Navami, Mahavir Jayanti, Eid al-Fitr, Diwali and Christmas.
import { between, pick, whole } from '../palettes';
import { burst, cloud, diya, dots, flower, gift, grass, kite, lantern, leaf, n, OUTLINE, sparkle, star, sun } from '../motifs';
import type { Design, Palette, Rng } from '../types';

/** Diwali A: a rangoli above a row of diyas. */
const rangoli: Design = (r, p) => {
  const petals = 8 + 2 * whole(r, 0, 3), rot = r() * Math.PI;
  let s = flower(540, 330, petals, 210, 70, p.acc, '#ffc93c', rot, 62);
  s += flower(540, 330, petals, 150, 52, [...p.acc.slice(2), ...p.acc.slice(0, 2)], '#ffc93c', rot, 62);
  s += `<circle cx="540" cy="330" r="28" fill="${p.head[1]}"/>`;
  for (let i = 0; i < 18; i++) {
    const a = (2 * Math.PI * i) / 18 + rot;
    s += `<circle cx="${n(540 + Math.cos(a) * 262)}" cy="${n(330 + Math.sin(a) * 262)}" r="9" fill="${pick(r, p.acc)}"/>`;
  }
  const count = whole(r, 4, 6);
  for (let i = 0; i < count; i++) s += diya(110 + (860 / (count - 1)) * i, 640 - between(r, 0, 18));
  return s;
};

/** Diwali B: sky lanterns and fireworks over diyas. */
const skyLanterns: Design = (r, p) => {
  let s = '';
  const bursts = whole(r, 3, 4);
  for (let b = 0; b < bursts; b++) s += burst(between(r, 120, 960), between(r, 90, 330), between(r, 60, 110), pick(r, p.acc), 14);
  const count = whole(r, 3, 4);
  for (let i = 0; i < count; i++) s += lantern(170 + (740 / (count - 1)) * i + between(r, -30, 30), between(r, 90, 230), pick(r, p.acc), p.ink);
  for (let i = 0; i < 3; i++) s += diya(300 + 240 * i, 645, 0.8);
  return s;
};

/** Christmas A: a tree with ornaments, a star and presents. */
const tree: Design = (r, p) => {
  const cx = between(r, 420, 660);
  let s = dots(r, 38);
  const tiers = [[160, 330, 240], [260, 420, 300], [360, 520, 370]];
  for (const [top, bottom, half] of tiers)
    s += `<path d="M${n(cx)} ${top} L${n(cx + half)} ${bottom} Q${n(cx)} ${bottom + 30} ${n(cx - half)} ${bottom} Z" fill="#2fa84f" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>`;
  s += `<rect x="${n(cx - 32)}" y="545" width="64" height="70" rx="8" fill="#8d5a3b"/>`;
  for (let i = 0; i < 15; i++) {
    const [top, bottom, half] = tiers[i % 3];
    const y = between(r, top + 70, bottom - 12), reach = (half * (y - top)) / (bottom - top);
    s += `<circle cx="${n(cx + between(r, -reach, reach) * 0.72)}" cy="${n(y)}" r="${n(between(r, 11, 16))}" fill="${pick(r, p.acc)}" stroke="#fff" stroke-width="3"/>`;
  }
  s += star(cx, 150, 52, '#ffc93c', between(r, -0.2, 0.2));
  const gifts = whole(r, 2, 4);
  for (let i = 0; i < gifts; i++) {
    const side = i % 2 ? 1 : -1, w = between(r, 80, 120), h = between(r, 60, 95);
    s += gift(cx + side * between(r, 230, 400) - w / 2, 640 - h, w, h, pick(r, p.acc));
  }
  return s;
};

/** Christmas B: a snowman under hanging baubles, with candy canes. */
const snowman: Design = (r, p) => {
  let s = dots(r, 46);
  const count = whole(r, 5, 7);
  for (let i = 0; i < count; i++) {
    const x = 70 + (940 / (count - 1)) * i + between(r, -25, 25), len = between(r, 60, 210);
    s += `<line x1="${n(x)}" y1="0" x2="${n(x)}" y2="${n(len)}" stroke="${p.ink}" stroke-width="3" opacity=".5"/>
<circle cx="${n(x)}" cy="${n(len + 30)}" r="${n(between(r, 26, 38))}" fill="${pick(r, p.acc)}" stroke="#fff" stroke-width="5"/>
<rect x="${n(x - 10)}" y="${n(len - 2)}" width="20" height="14" rx="3" fill="#ffc93c"/>`;
  }
  const sx = between(r, 430, 650);
  s += `<circle cx="${n(sx)}" cy="520" r="120" fill="#fff" stroke="${p.ink}" stroke-opacity=".15" stroke-width="6"/>
<circle cx="${n(sx)}" cy="350" r="82" fill="#fff" stroke="${p.ink}" stroke-opacity=".15" stroke-width="6"/>
<circle cx="${n(sx - 28)}" cy="335" r="9" fill="${p.ink}"/><circle cx="${n(sx + 28)}" cy="335" r="9" fill="${p.ink}"/>
<path d="M${n(sx)} 355 l55 14 l-55 10 z" fill="#ff8c42"/>
<path d="M${n(sx - 30)} 385 q30 22 60 0" fill="none" stroke="${p.ink}" stroke-width="6" stroke-linecap="round"/>
<rect x="${n(sx - 95)}" y="415" width="190" height="34" rx="17" fill="${pick(r, p.acc)}"/>
<rect x="${n(sx + 40)}" y="430" width="34" height="90" rx="12" fill="${pick(r, p.acc)}"/>
<path d="M${n(sx - 70)} 280 h140 l-20 -80 h-100 z" fill="${p.ink}"/>`;
  for (const side of [-1, 1]) {
    const x = sx + side * between(r, 230, 340);
    s += `<path d="M${n(x)} 640 V470 a32 32 0 0 1 64 0" fill="none" stroke="#fff" stroke-width="22" stroke-linecap="round"/>
<path d="M${n(x)} 640 V470 a32 32 0 0 1 64 0" fill="none" stroke="#e8382a" stroke-width="22" stroke-dasharray="16 16"/>`;
  }
  return s;
};

// ---- Shared pieces for the festival drawings below (local to this file). ----

/** Draws `body` (made around 0,0) moved to (x, y), scaled, optionally mirrored and turned. */
const at = (x: number, y: number, s: number, body: string, flip = false, rot = 0) =>
  `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)}) scale(${n(flip ? -s : s)} ${n(s)})">${body}</g>`;

/** A soft ink outline for white and pale shapes, so they don't vanish on the pale card. */
const soft = (p: Palette, w = 5) => `stroke="${p.ink}" stroke-opacity=".18" stroke-width="${w}" stroke-linejoin="round"`;

const GREEN = '#3f9b3a', LEAF = '#5cb85c', CLAY = '#c75b2a', GOLD = '#ffc93c', CREAM = '#fff4c2';

/** A marigold: a ruffled orange ball. White rim first, then the petals over it. */
function marigold(x: number, y: number, R: number, colour = '#ff8f1f') {
  let rim = '', top = '';
  for (let i = 0; i < 10; i++) {
    const a = (2 * Math.PI * i) / 10;
    const cx = n(x + Math.cos(a) * R * 0.55), cy = n(y + Math.sin(a) * R * 0.55);
    rim += `<circle cx="${cx}" cy="${cy}" r="${n(R * 0.48)}" fill="#fff"/>`;
    top += `<circle cx="${cx}" cy="${cy}" r="${n(R * 0.42)}" fill="${colour}"/>`;
  }
  return `${rim}${top}<circle cx="${n(x)}" cy="${n(y)}" r="${n(R * 0.55)}" fill="#ffb52e"/><circle cx="${n(x)}" cy="${n(y)}" r="${n(R * 0.25)}" fill="#ffd54a"/>`;
}

/** A pointed leaf hanging straight down from (x, y). */
const hangingLeaf = (x: number, y: number, len: number, fill: string, tilt = 0) =>
  `<g transform="rotate(${n(tilt)} ${n(x)} ${n(y)})"><path d="M${n(x)} ${n(y)} q${n(len * 0.36)} ${n(len * 0.45)} 0 ${n(len)} q${n(-len * 0.36)} ${n(-len * 0.55)} 0 ${n(-len)} z" fill="${fill}" ${OUTLINE}/><path d="M${n(x)} ${n(y + 4)} v${n(len * 0.8)}" stroke="#fff" stroke-width="3" opacity=".6"/></g>`;

/** A toran: mango leaves and marigolds on a string across the top. */
function toran(r: Rng, y: number, count: number) {
  let s = `<path d="M30 ${n(y)} Q540 ${n(y + 34)} 1050 ${n(y)}" fill="none" stroke="#8d5a3b" stroke-width="5"/>`;
  for (let i = 0; i <= count; i++) {
    const x = 50 + (980 / count) * i, t = (x - 30) / 1020, yy = y + 4 * 34 * t * (1 - t) * 0.5;
    if (i % 2) s += hangingLeaf(x, yy, between(r, 74, 92), i % 4 === 1 ? GREEN : LEAF, between(r, -6, 6));
    else s += marigold(x, yy + 14, 20, i % 4 ? '#ff8f1f' : '#ffb300');
  }
  return s;
}

/** A garland of marigolds sagging between two points. */
function garland(x1: number, y1: number, x2: number, y2: number, sag: number, count: number, R = 17) {
  let s = '';
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + sag * 2;
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const x = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * mx + t * t * x2;
    const y = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * my + t * t * y2;
    s += marigold(x, y, R, i % 2 ? '#ff8f1f' : '#ffb300');
  }
  return s;
}

/** A lotus seen from the side; (0, 0) is the middle of its base. */
function lotus(fill: string, pad = true) {
  const petal = (a: number, h: number, w: number, c: string) =>
    `<path d="M0 0 Q${-w} ${n(-h * 0.55)} 0 ${-h} Q${w} ${n(-h * 0.55)} 0 0 Z" fill="${c}" ${OUTLINE} transform="rotate(${a})"/>`;
  return (pad ? `<ellipse cx="0" cy="8" rx="120" ry="24" fill="${LEAF}" ${OUTLINE}/>` : '') +
    petal(-62, 78, 30, fill) + petal(62, 78, 30, fill) + petal(-32, 104, 36, fill) + petal(32, 104, 36, fill) +
    `<g opacity=".9">${petal(-14, 120, 40, '#fff')}${petal(14, 120, 40, '#fff')}</g>` + petal(0, 128, 42, fill) +
    `<path d="M0 -12 v-70" stroke="#fff" stroke-width="4" opacity=".6"/>`;
}

/** A white dove flying right, a little sprig in its beak; (0, 0) is its middle. */
const dove = (p: Palette, sprig = true) =>
  `<path d="M-58 -2 L-120 -34 L-112 6 L-122 30 Z" fill="#fff" ${soft(p)}/>
<ellipse cx="0" cy="0" rx="74" ry="36" fill="#fff" ${soft(p)}/>
<circle cx="62" cy="-26" r="27" fill="#fff" ${soft(p)}/>
<path d="M86 -30 l22 8 l-22 6 z" fill="#ff9f43"/>
<circle cx="70" cy="-32" r="4.5" fill="${p.ink}"/>
<path d="M-30 -10 Q-40 -110 30 -112 Q8 -60 30 -12 Z" fill="#fff" ${soft(p)}/>
<path d="M-12 -30 Q-8 -70 14 -88 M2 -24 Q8 -56 22 -70" stroke="${p.ink}" stroke-opacity=".14" stroke-width="4" fill="none" stroke-linecap="round"/>` +
  (sprig ? `<path d="M104 -18 q14 18 6 42" stroke="${GREEN}" stroke-width="4" fill="none"/>${leaf(108, -6, 26, LEAF, 30)}${leaf(110, 12, 24, GREEN, -20)}` : '');

/** A white lily on its stem; (0, 0) is the foot of the stem, h its height. */
function lily(p: Palette, h: number, lean = 1) {
  const top = -h, petal = (a: number, len: number) =>
    `<path d="M0 0 Q-22 ${-len * 0.5} 0 ${-len} Q22 ${-len * 0.5} 0 0 Z" fill="#fff" ${soft(p, 4)} transform="translate(${n(lean * 8)} ${top}) rotate(${a})"/>`;
  return `<path d="M0 0 Q${n(-lean * 20)} ${n(-h * 0.5)} ${n(lean * 8)} ${top}" stroke="${GREEN}" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M0 0 Q${n(-lean * 60)} ${n(-h * 0.35)} ${n(-lean * 44)} ${n(-h * 0.62)} Q${n(-lean * 20)} ${n(-h * 0.3)} 0 0 Z" fill="${LEAF}" ${OUTLINE}/>
${petal(-58, 70)}${petal(58, 70)}${petal(-24, 84)}${petal(24, 84)}${petal(0, 90)}
<path d="M${n(lean * 8)} ${top} l-10 -46 M${n(lean * 8)} ${top} l0 -52 M${n(lean * 8)} ${top} l10 -46" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/>
<circle cx="${n(lean * 8 - 10)}" cy="${top - 48}" r="6" fill="#e0a526"/><circle cx="${n(lean * 8)}" cy="${top - 54}" r="6" fill="#e0a526"/><circle cx="${n(lean * 8 + 10)}" cy="${top - 48}" r="6" fill="#e0a526"/>`;
}

/** A crescent moon opening to the right, made of two circles; (0, 0) is the middle of the outer circle. */
function crescent(R: number, fill: string) {
  const R2 = R * 0.84, d = R * 0.46;
  const x = (d * d + R * R - R2 * R2) / (2 * d), y = Math.sqrt(R * R - x * x);
  return `<path d="M${n(x)} ${n(-y)} A${n(R)} ${n(R)} 0 1 0 ${n(x)} ${n(y)} A${n(R2)} ${n(R2)} 0 ${x > d ? 1 : 0} 1 ${n(x)} ${n(-y)} Z" fill="${fill}" ${OUTLINE}/>`;
}

/** A fanoos (Ramadan lantern) hanging from the top edge; (x, top) is where its body starts. */
function fanoos(x: number, top: number, colour: string, ink: string) {
  return `<line x1="${n(x)}" y1="0" x2="${n(x)}" y2="${n(top - 34)}" stroke="${ink}" stroke-width="3" opacity=".45"/>
<circle cx="${n(x)}" cy="${n(top - 40)}" r="9" fill="none" stroke="${GOLD}" stroke-width="5"/>
<path d="M${n(x - 38)} ${n(top + 6)} Q${n(x)} ${n(top - 54)} ${n(x + 38)} ${n(top + 6)} Z" fill="${colour}" ${OUTLINE}/>
<path d="M${n(x - 44)} ${n(top + 6)} h88 l16 46 l-16 80 h-88 l-16 -80 z" fill="${colour}" ${OUTLINE}/>
<path d="M${n(x - 26)} ${n(top + 22)} h52 l8 30 l-8 56 h-52 l-8 -56 z" fill="${CREAM}"/>
<path d="M${n(x)} ${n(top + 22)} v86 M${n(x - 34)} ${n(top + 52)} h68" stroke="${colour}" stroke-width="5" opacity=".7"/>
<path d="M${n(x - 30)} ${n(top + 132)} h60 l-14 26 h-32 z" fill="${colour}" ${OUTLINE}/>
<path d="M${n(x)} ${n(top + 158)} v24" stroke="${GOLD}" stroke-width="6" stroke-linecap="round"/><circle cx="${n(x)}" cy="${n(top + 188)}" r="8" fill="${GOLD}"/>`;
}

/** A plate of round sweets (laddoos) on a little brass plate; (x, y) is the plate's middle. */
function sweets(x: number, y: number, r: Rng, colour: string) {
  let s = `<ellipse cx="${n(x)}" cy="${n(y)}" rx="92" ry="22" fill="#e0a526" ${OUTLINE}/>`;
  const rows = [[-54, -18, 18, 54], [-36, 0, 36], [-18, 18]];
  rows.forEach((row, k) => {
    for (const dx of row) s += `<circle cx="${n(x + dx)}" cy="${n(y - 18 - k * 30)}" r="${n(between(r, 19, 22))}" fill="${colour}" stroke="#fff" stroke-width="3"/>`;
  });
  return s;
}

/** A splash of colour powder: a round puff with smaller puffs and specks around it. */
function puff(r: Rng, x: number, y: number, R: number, colour: string) {
  let s = `<g opacity=".9"><circle cx="${n(x)}" cy="${n(y)}" r="${n(R)}" fill="${colour}"/>`;
  const k = whole(r, 7, 10);
  for (let i = 0; i < k; i++) {
    const a = (2 * Math.PI * i) / k + between(r, -0.2, 0.2), d = R * between(r, 0.75, 0.95);
    s += `<circle cx="${n(x + Math.cos(a) * d)}" cy="${n(y + Math.sin(a) * d)}" r="${n(R * between(r, 0.32, 0.5))}" fill="${colour}"/>`;
    const d2 = R * between(r, 1.45, 1.8);
    s += `<circle cx="${n(x + Math.cos(a + 0.3) * d2)}" cy="${n(y + Math.sin(a + 0.3) * d2)}" r="${n(between(r, 5, 11))}" fill="${colour}"/>`;
  }
  return s + '</g>';
}

/** A little water balloon with its knot, flying with motion lines; (0, 0) is its middle. */
const waterBalloon = (fill: string, ink: string) =>
  `<path d="M-74 -16 h-40 M-70 6 h-58 M-74 28 h-34" stroke="${ink}" stroke-width="5" stroke-linecap="round" opacity=".25"/>
<path d="M0 -44 C40 -44 52 -4 40 18 C30 38 12 44 0 44 C-12 44 -50 34 -50 0 C-50 -30 -30 -44 0 -44 Z" fill="${fill}" ${OUTLINE} transform="rotate(-70)"/>
<ellipse cx="-14" cy="-14" rx="9" ry="14" fill="#fff" opacity=".55" transform="rotate(30 -14 -14)"/>
<path d="M44 -14 l14 -10 l2 18 z" fill="${fill}" ${OUTLINE}/>`;

/** A raw green mango with a leaf; (0, 0) is its stalk. */
const mango = (fill = '#8bc34a', blush = '#cddc39') =>
  `<path d="M0 0 C46 -6 66 50 44 92 C26 124 -26 126 -44 92 C-60 58 -42 4 0 0 Z" fill="${fill}" ${OUTLINE}/>
<ellipse cx="22" cy="34" rx="14" ry="24" fill="${blush}" opacity=".7"/>
<path d="M0 0 v-14" stroke="#6d4c2f" stroke-width="6" stroke-linecap="round"/>${leaf(0, -12, 64, GREEN, -30)}`;

/** A neem sprig with clusters of tiny white flowers; (0, 0) is the cut end, it grows up. */
function neem(r: Rng, p: Palette, h: number) {
  let s = `<path d="M0 0 Q14 ${n(-h * 0.5)} 0 ${-h}" stroke="#6d8b3a" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  for (let i = 1; i <= 4; i++) {
    const y = -h * (i / 5);
    s += leaf(6, y, 40, i % 2 ? GREEN : LEAF, -20) + leaf(6, y, 40, i % 2 ? LEAF : GREEN, -160);
  }
  for (let i = 0; i < 9; i++)
    s += `<circle cx="${n(between(r, -26, 26))}" cy="${n(-h - between(r, -6, 40))}" r="7" fill="#fff" ${soft(p, 3)}/>`;
  return s;
}

/** A sugarcane stalk with leaves at the top; (0, 0) is its foot. */
function sugarcane(h: number, fill = '#7b3f61') {
  let s = `<rect x="-13" y="${-h}" width="26" height="${h}" rx="10" fill="${fill}" ${OUTLINE}/>`;
  for (let y = -60; y > -h + 30; y -= 70) s += `<path d="M-11 ${y} h22" stroke="#fff" stroke-width="4" opacity=".55"/>`;
  return s + leaf(0, -h + 6, 120, GREEN, -60) + leaf(0, -h + 6, 110, LEAF, -125) + leaf(0, -h + 20, 100, GREEN, -20);
}

/** A tiny seated bird facing right; (0, 0) is its middle. */
const bird = (fill: string, ink: string) =>
  `<path d="M-26 0 l-30 -14 l6 26 z" fill="${fill}" ${OUTLINE}/>
<circle cx="0" cy="0" r="30" fill="${fill}" ${OUTLINE}/>
<ellipse cx="6" cy="10" rx="18" ry="13" fill="#fff" opacity=".45"/>
<path d="M-18 -4 q14 22 30 4" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>
<path d="M28 -6 l16 6 l-16 6 z" fill="#ff9f43"/><circle cx="14" cy="-8" r="4.5" fill="${ink}"/>
<path d="M-6 28 v12 M6 28 v12" stroke="#ff9f43" stroke-width="4" stroke-linecap="round"/>`;

// ---- Makar Sankranti and Pongal ----

/** Sankranti A: kites in a clear sky over a smiling sun. */
const kites: Design = (r, p) => {
  let s = cloud(between(r, 160, 260), between(r, 170, 230), between(r, 0.7, 0.9)) + cloud(between(r, 800, 920), between(r, 120, 180), between(r, 0.6, 0.8));
  const sx = between(r, 470, 610);
  s += sun(sx, 520, 95);
  const count = whole(r, 4, 5), slots = count === 4 ? [140, 400, 680, 930] : [120, 330, 540, 750, 950];
  slots.forEach((x0, i) => {
    const x = x0 + between(r, -25, 25), y = (i % 2 ? 230 : 110) + between(r, -15, 25);
    const foot = 60 + (960 / (count - 1)) * i + between(r, -30, 30);
    s += `<path d="M${n(x)} ${n(y)} Q${n((x + foot) / 2 + between(r, -60, 60))} ${n((y + 650) / 2 + 60)} ${n(foot)} 650" fill="none" stroke="${p.ink}" stroke-width="2.5" opacity=".3"/>`;
    s += kite(x, y, between(r, 0.6, 0.78), p.acc[i % p.acc.length], pick(r, p.acc), between(r, -22, 22));
  });
  for (let i = 0; i < 3; i++) {
    const bx = between(r, 280, 820), by = between(r, 300, 380);
    s += `<path d="M${n(bx - 18)} ${n(by)} q9 -10 18 0 q9 -10 18 0" fill="none" stroke="${p.ink}" stroke-width="4" stroke-linecap="round" opacity=".45"/>`;
  }
  return s + grass(r, LEAF);
};

/** Sankranti B: a pongal pot overflowing with rice on three stones, sugarcane and a kolam. */
const pongalPot: Design = (r, p) => {
  const cx = between(r, 500, 580), band = pick(r, p.acc);
  let s = sun(between(r, 900, 960), between(r, 110, 150), 55);
  // kolam: dots and loops on the floor
  const kc = whole(r, 3, 4);
  for (let i = 0; i < kc; i++) {
    const kx = (i < kc / 2 ? 110 : 760) + (i % 2) * 160 + between(r, -10, 10), ky = 612;
    s += `<path d="M${n(kx - 60)} ${ky} Q${n(kx)} ${ky - 40} ${n(kx + 60)} ${ky} Q${n(kx)} ${ky + 40} ${n(kx - 60)} ${ky} Z M${n(kx)} ${ky - 30} Q${n(kx + 40)} ${ky} ${n(kx)} ${ky + 30} Q${n(kx - 40)} ${ky} ${n(kx)} ${ky - 30} Z" fill="none" stroke="${pick(r, p.acc)}" stroke-width="5"/>`;
    for (const [dx, dy] of [[-30, 0], [30, 0], [0, -14], [0, 14]]) s += `<circle cx="${n(kx + dx)}" cy="${ky + dy}" r="5" fill="${p.ink}" opacity=".5"/>`;
  }
  // sugarcane leaning on both sides
  s += at(cx - 210, 640, 1, sugarcane(between(r, 420, 470)), false, -8) + at(cx - 170, 640, 1, sugarcane(between(r, 380, 430), '#8e4b6f'), false, -3);
  s += at(cx + 210, 640, 1, sugarcane(between(r, 420, 470)), false, 8) + at(cx + 170, 640, 1, sugarcane(between(r, 380, 430), '#8e4b6f'), false, 3);
  // hint of fire between three stones
  s += `<path d="M${n(cx - 40)} 610 q20 -46 40 -8 q16 -40 40 8 z" fill="#ffb300" opacity=".85"/>`;
  for (const dx of [-110, 0, 110]) s += `<ellipse cx="${n(cx + dx)}" cy="618" rx="${dx ? 46 : 38}" ry="26" fill="#a39b93" ${OUTLINE}/>`;
  // the pot
  const top = 300;
  s += `<path d="M${n(cx - 72)} ${top + 40} C${n(cx - 200)} ${top + 90} ${n(cx - 180)} 590 ${n(cx)} 594 C${n(cx + 180)} 590 ${n(cx + 200)} ${top + 90} ${n(cx + 72)} ${top + 40} Z" fill="${CLAY}" ${OUTLINE}/>
<rect x="${n(cx - 80)}" y="${top + 6}" width="160" height="40" rx="10" fill="${CLAY}" ${OUTLINE}/>
<path d="M${n(cx - 150)} ${top + 150} Q${n(cx)} ${top + 190} ${n(cx + 150)} ${top + 150}" stroke="${band}" stroke-width="26" fill="none" stroke-linecap="round"/>`;
  for (let i = 0; i < 7; i++) {
    const x = cx - 120 + 40 * i;
    s += `<circle cx="${n(x)}" cy="${n(top + 158 + 18 * Math.sin((Math.PI * i) / 6))}" r="6" fill="#fff"/>`;
  }
  for (let i = 0; i < 5; i++) {
    const x = cx - 100 + 50 * i;
    s += `<path d="M${n(x)} ${top + 230} l14 22 l-14 22 l-14 -22 z" fill="#fff" opacity=".85"/>`;
  }
  // turmeric leaves tied at the neck
  s += leaf(cx - 20, top + 30, 110, GREEN, -120) + leaf(cx + 20, top + 30, 110, LEAF, -60) + leaf(cx, top + 30, 96, GREEN, -92);
  s += `<path d="M${n(cx - 80)} ${top + 38} h160" stroke="${GOLD}" stroke-width="8" stroke-linecap="round"/>`;
  // rice bubbling over
  s += `<path d="M${n(cx - 92)} ${top + 10} q-6 -40 30 -38 q10 -36 50 -22 q24 -30 54 -4 q38 -10 40 30 q14 22 -4 34 q4 46 -16 46 q-14 0 -12 -40 q-70 6 -134 2 q4 26 -10 26 q-18 -6 -8 -34 z" fill="#fff" ${soft(p)}/>`;
  for (let i = 0; i < 6; i++) s += `<ellipse cx="${n(cx - 60 + 24 * i + between(r, -6, 6))}" cy="${n(top - 10 + between(r, -10, 10))}" rx="5" ry="3" fill="${p.ink}" opacity=".12"/>`;
  return s;
};

// ---- Holi ----

/** Holi A: clouds of colour powder with water balloons flying. */
const colourClouds: Design = (r, p) => {
  let s = '';
  const spots = [[540, 330, 120], [330, 260, 92], [760, 250, 96], [400, 470, 80], [690, 470, 86], [220, 450, 60], [870, 440, 64]];
  const order = [...p.acc].sort(() => r() - 0.5);
  spots.forEach(([x, y, R], i) => (s += puff(r, x + between(r, -20, 20), y + between(r, -20, 20), R * between(r, 0.9, 1.08), order[i % order.length])));
  for (let i = 0; i < 3; i++) s += star(between(r, 80, 1000), between(r, 40, 140), between(r, 14, 22), GOLD);
  const balloons = whole(r, 3, 4);
  for (let i = 0; i < balloons; i++) {
    const x = 160 + (760 / (balloons - 1)) * i + between(r, -30, 30), y = i % 2 ? between(r, 560, 600) : between(r, 100, 150);
    s += at(x, y, between(r, 0.8, 1), waterBalloon(pick(r, p.acc), p.ink), i % 2 === 1, between(r, -12, 12));
  }
  return s;
};

/** Holi B: plates of coloured powder and a playful pichkari spraying droplets. */
const pichkari: Design = (r, p) => {
  let s = '';
  const plates = whole(r, 3, 4), x0 = plates === 3 ? 360 : 300, step = plates === 3 ? 230 : 210;
  for (let i = 0; i < plates; i++) {
    const x = x0 + step * i + between(r, -10, 10), y = 615 - (i % 2) * 20, c = p.acc[(i + 1) % p.acc.length];
    s += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="95" ry="26" fill="#e0a526" ${OUTLINE}/>
<path d="M${n(x - 70)} ${n(y - 4)} Q${n(x - 40)} ${n(y - 80)} ${n(x)} ${n(y - 82)} Q${n(x + 40)} ${n(y - 80)} ${n(x + 70)} ${n(y - 4)} Z" fill="${c}" ${OUTLINE}/>
<circle cx="${n(x + 30)}" cy="${n(y - 2)}" r="7" fill="${c}"/><circle cx="${n(x - 44)}" cy="${n(y + 4)}" r="5" fill="${c}"/>`;
  }
  // the pichkari, held at an upward angle on the left
  const px = 150, py = 520, ang = -between(r, 28, 38), body = pick(r, p.acc), cap = pick(r, p.acc.filter((c) => c !== body));
  s += at(px, py, 1, `<rect x="-120" y="-10" width="70" height="20" rx="8" fill="${cap}" ${OUTLINE}/>
<rect x="-150" y="-36" width="34" height="72" rx="16" fill="${cap}" ${OUTLINE}/>
<rect x="-60" y="-40" width="190" height="80" rx="34" fill="${body}" ${OUTLINE}/>
<path d="M-24 -38 v76 M20 -38 v76 M64 -38 v76" stroke="#fff" stroke-width="8" opacity=".6"/>
<path d="M126 -22 l60 14 v16 l-60 14 z" fill="${cap}" ${OUTLINE}/>`, false, ang);
  // spray of droplets in an arc from the nozzle
  const a = (ang * Math.PI) / 180, nx = px + Math.cos(a) * 190, ny = py + Math.sin(a) * 190;
  for (let i = 0; i < 26; i++) {
    const t = i / 25, d = 40 + t * 700;
    const x = nx + Math.cos(a) * d * 0.95 + d * 0.25, y = ny + Math.sin(a) * d * 0.9 + t * t * 420 - 20 + between(r, -18, 18);
    if (x > 1040 || y > 520) break;
    s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(between(r, 7, 15) * (1 - t * 0.3))}" fill="${p.acc[i % p.acc.length]}"/>`;
  }
  s += puff(r, between(r, 820, 920), between(r, 140, 220), 56, pick(r, p.acc)) + puff(r, between(r, 560, 660), between(r, 70, 110), 36, pick(r, p.acc));
  return s;
};

// ---- Ugadi ----

/** Ugadi A: a mango-leaf toran over a kolam, with raw mangoes and neem flowers. */
const ugadiKolam: Design = (r, p) => {
  let s = toran(r, 26, whole(r, 7, 8) * 2);
  const cx = 540, cy = 400, petals = pick(r, [6, 8]), rot = r() * Math.PI;
  s += `<path d="M${cx} ${cy - 200} L${cx + 200} ${cy} L${cx} ${cy + 200} L${cx - 200} ${cy} Z" fill="none" stroke="${p.acc[0]}" stroke-width="10" stroke-linejoin="round"/>`;
  s += flower(cx, cy, petals, 170, 66, [p.acc[1], p.acc[3]], GOLD, rot, 34);
  s += flower(cx, cy, petals, 96, 40, [p.acc[2], p.acc[4]], p.head[1], rot + Math.PI / petals, 22);
  for (let i = 0; i < 4; i++) {
    const a = (Math.PI / 2) * i;
    s += `<circle cx="${n(cx + Math.cos(a) * 228)}" cy="${n(cy + Math.sin(a) * 228)}" r="12" fill="${pick(r, p.acc)}" ${OUTLINE}/>`;
  }
  for (let i = 0; i < 12; i++) {
    const a = (2 * Math.PI * (i + 0.5)) / 12;
    s += `<circle cx="${n(cx + Math.cos(a) * 160)}" cy="${n(cy + Math.sin(a) * 160)}" r="6" fill="${p.ink}" opacity=".45"/>`;
  }
  s += at(between(r, 150, 190), 560, 0.9, mango()) + at(between(r, 250, 280), 580, 0.75, mango('#9ccc65'), true);
  s += at(between(r, 860, 900), 645, 1, neem(r, p, between(r, 220, 260))) + at(between(r, 960, 990), 645, 0.8, neem(r, p, 200), true);
  return s;
};

/** Ugadi B: a bowl of Ugadi pachadi among raw mangoes, neem flowers and marigold swags. */
const pachadi: Design = (r, p) => {
  let s = garland(40, 20, 540, 30, between(r, 40, 70), 9) + garland(540, 30, 1040, 20, between(r, 40, 70), 9);
  s += marigold(540, 40, 28, '#ffb300');
  const cx = between(r, 520, 560);
  s += at(cx - 230, 600, 1.15, neem(r, p, 300), false, -10) + at(cx + 250, 600, 1, neem(r, p, 280), true, 12);
  // the bowl
  s += `<ellipse cx="${n(cx)}" cy="420" rx="190" ry="40" fill="#c58b2c" ${OUTLINE}/>
<path d="M${n(cx - 190)} 420 Q${n(cx - 180)} 580 ${n(cx)} 590 Q${n(cx + 180)} 580 ${n(cx + 190)} 420 Z" fill="#e0a526" ${OUTLINE}/>
<ellipse cx="${n(cx)}" cy="420" rx="168" ry="30" fill="#b9772e"/>
<path d="M${n(cx - 150)} 480 Q${n(cx)} 520 ${n(cx + 150)} 480" stroke="${p.acc[0]}" stroke-width="16" fill="none" stroke-linecap="round"/>
<rect x="${n(cx - 70)}" y="588" width="140" height="30" rx="12" fill="#c58b2c" ${OUTLINE}/>`;
  for (let i = 0; i < 9; i++) s += `<circle cx="${n(cx + between(r, -130, 130))}" cy="${n(420 + between(r, -14, 14))}" r="${n(between(r, 6, 10))}" fill="${pick(r, ['#9ccc65', '#fff4c2', '#6d4c2f', '#ffffff'])}"/>`;
  for (let i = -1; i <= 1; i++) s += marigold(cx + i * 100, 500 + Math.abs(i) * -8, 16, i ? '#ff8f1f' : '#ffb300');
  // mangoes in front
  const m = whole(r, 2, 3);
  for (let i = 0; i < m; i++) {
    const side = i % 2 ? 1 : -1, x = cx + side * (230 + 110 * Math.floor(i / 2)) + between(r, -15, 15);
    s += at(x, 525, between(r, 0.8, 0.95), mango(i % 2 ? '#8bc34a' : '#9ccc65'), side > 0, between(r, -15, 15));
  }
  return s;
};

// ---- Good Friday (quiet palette) ----

/** Good Friday A: a plain cross on a gentle hill at dawn, with lilies. */
const hillCross: Design = (r, p) => {
  const cx = between(r, 500, 580);
  let s = `<circle cx="${n(cx + between(r, 180, 260))}" cy="430" r="110" fill="${p.acc[1]}" opacity=".7"/><circle cx="${n(cx + 220)}" cy="430" r="150" fill="${p.acc[1]}" opacity=".25"/>`;
  s += `<path d="M30 650 Q${n(cx - 200)} 450 ${n(cx)} 470 Q${n(cx + 260)} 480 1050 600 V650 Z" fill="${p.acc[4]}" ${OUTLINE}/>`;
  s += `<rect x="${n(cx - 17)}" y="170" width="34" height="320" rx="6" fill="#a58b73" ${OUTLINE}/><rect x="${n(cx - 92)}" y="250" width="184" height="32" rx="6" fill="#a58b73" ${OUTLINE}/>`;
  for (let i = 0; i < 2; i++) {
    const bx = between(r, 160, 360) + i * 520, by = between(r, 120, 200);
    s += `<path d="M${n(bx - 20)} ${n(by)} q10 -11 20 0 q10 -11 20 0" fill="none" stroke="${p.ink}" stroke-width="4" stroke-linecap="round" opacity=".35"/>`;
  }
  const lilies = whole(r, 2, 3);
  for (let i = 0; i < lilies; i++) s += at(cx - 230 - 90 * i + between(r, -15, 15), 640, between(r, 0.85, 1), lily(p, between(r, 160, 200), 1));
  s += at(cx + 260 + between(r, -15, 15), 640, 0.95, lily(p, between(r, 160, 190), -1), true);
  return s;
};

/** Good Friday B: a softly glowing candle between lilies, a dove above. */
const candle: Design = (r, p) => {
  const cx = between(r, 520, 560);
  let s = `<circle cx="${n(cx)}" cy="290" r="150" fill="${p.acc[1]}" opacity=".25"/><circle cx="${n(cx)}" cy="290" r="95" fill="${p.acc[1]}" opacity=".35"/>`;
  s += `<ellipse cx="${n(cx)}" cy="625" rx="120" ry="22" fill="${p.acc[3]}" ${OUTLINE}/>
<rect x="${n(cx - 52)}" y="340" width="104" height="280" rx="14" fill="#fffaf0" ${soft(p)}/>
<path d="M${n(cx - 52)} 360 q16 22 26 0 v40" fill="none" stroke="${p.ink}" stroke-opacity=".1" stroke-width="5"/>
<path d="M${n(cx)} 340 v-24" stroke="${p.ink}" stroke-width="4" opacity=".6"/>
<path d="M${n(cx)} 236 q26 40 0 80 q-26 -40 0 -80 z" fill="#ffb300" opacity=".9"/><path d="M${n(cx)} 268 q10 18 0 40 q-10 -18 0 -40 z" fill="${CREAM}"/>`;
  s += at(cx - 210, 640, 1, lily(p, between(r, 220, 260), 1)) + at(cx - 320, 640, 0.85, lily(p, between(r, 160, 200), 1));
  s += at(cx + 210, 640, 1, lily(p, between(r, 220, 260), 1), true) + at(cx + 320, 640, 0.85, lily(p, between(r, 160, 200), 1), true);
  const left = r() < 0.5;
  s += at(left ? between(r, 200, 260) : between(r, 820, 880), between(r, 130, 170), 0.85, dove(p), !left, left ? -6 : 6);
  return s;
};

// ---- Ram Navami ----

/** Ram Navami A: a decorated cradle with marigold garlands, flowers and lotuses. */
const cradle: Design = (r, p) => {
  const cx = between(r, 520, 560), wood = '#a0612f', body = pick(r, p.acc), trim = pick(r, p.acc.filter((c) => c !== body));
  let s = `<rect x="${n(cx - 290)}" y="70" width="26" height="570" rx="10" fill="${wood}" ${OUTLINE}/><rect x="${n(cx + 264)}" y="70" width="26" height="570" rx="10" fill="${wood}" ${OUTLINE}/>
<rect x="${n(cx - 310)}" y="56" width="620" height="32" rx="14" fill="${wood}" ${OUTLINE}/>
<circle cx="${n(cx - 277)}" cy="48" r="16" fill="${GOLD}" ${OUTLINE}/><circle cx="${n(cx + 277)}" cy="48" r="16" fill="${GOLD}" ${OUTLINE}/>`;
  s += garland(cx - 270, 96, cx + 270, 96, between(r, 30, 45), 13, 16);
  s += `<path d="M${n(cx - 150)} 88 L${n(cx - 175)} 360 M${n(cx + 150)} 88 L${n(cx + 175)} 360" stroke="${GOLD}" stroke-width="6" stroke-dasharray="14 8"/>`;
  s += `<path d="M${n(cx - 220)} 350 Q${n(cx)} 380 ${n(cx + 220)} 350 Q${n(cx + 200)} 520 ${n(cx)} 525 Q${n(cx - 200)} 520 ${n(cx - 220)} 350 Z" fill="${body}" ${OUTLINE}/>
<path d="M${n(cx - 200)} 400 Q${n(cx)} 440 ${n(cx + 200)} 400" stroke="${trim}" stroke-width="18" fill="none" stroke-linecap="round"/>
<path d="M${n(cx - 230)} 346 Q${n(cx)} 330 ${n(cx + 230)} 346" stroke="${GOLD}" stroke-width="14" fill="none" stroke-linecap="round"/>`;
  for (let i = 0; i < 7; i++) s += `<circle cx="${n(cx - 150 + 50 * i)}" cy="${n(458 + 10 * Math.sin((Math.PI * i) / 6))}" r="8" fill="#fff"/>`;
  for (const dx of [-170, 170]) s += marigold(cx + dx, 360, 26, '#ffb300');
  s += at(cx - 150, 640, 0.75, lotus(p.acc[0])) + at(cx + 150, 640, 0.75, lotus(p.acc[0]));
  for (let i = 0; i < 4; i++) {
    const side = i % 2 ? 1 : -1;
    s += flower(cx + side * between(r, 360, 450), between(r, 180, 520), 6, 50, 26, [pick(r, p.acc)], GOLD, r() * 3, 10);
  }
  return s;
};

/** Ram Navami B: a sun rising over a lotus pond, a festive bow and arrows crossed above, garlands. */
const bowAndSun: Design = (r, p) => {
  let s = garland(40, 24, 1040, 24, between(r, 25, 40), 22, 15);
  const sx = between(r, 500, 580);
  s += sun(sx, 470, 110, GOLD, false);
  s += `<path d="M30 520 Q540 490 1050 520 V650 H30 Z" fill="${p.acc[2]}" opacity=".55"/><path d="M30 520 Q540 490 1050 520" fill="none" stroke="#fff" stroke-width="6"/>`;
  for (let i = 0; i < 3; i++) s += `<path d="M${n(between(r, 100, 900))} ${n(560 + 30 * i)} h${n(between(r, 60, 120))}" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>`;
  const lotuses = whole(r, 2, 3);
  for (let i = 0; i < lotuses; i++) {
    const x = lotuses === 2 ? [230, 850][i] : [180, 540, 900][i];
    s += at(x + between(r, -20, 20), 610, between(r, 0.7, 0.85), lotus(i === 1 ? p.acc[4] : p.acc[0]));
  }
  // bow and two arrows, crossed like an emblem, pointing up
  const bx = sx, by = 210, bow = '#a0612f';
  for (const a of [-28, 28])
    s += at(bx, by, 1, `<path d="M0 120 V-130" stroke="#8d6e63" stroke-width="9" stroke-linecap="round"/>
<path d="M0 -168 l-16 34 h32 z" fill="${GOLD}" ${OUTLINE}/>
<path d="M0 104 l-16 22 v-28 l16 -16 l16 16 v28 z" fill="${pick(r, p.acc)}" ${OUTLINE}/>`, false, a);
  s += `<path d="M${n(bx - 120)} ${by - 110} Q${n(bx + 50)} ${by} ${n(bx - 120)} ${by + 110}" fill="none" stroke="#fff" stroke-width="22" stroke-linecap="round"/>
<path d="M${n(bx - 120)} ${by - 110} Q${n(bx + 50)} ${by} ${n(bx - 120)} ${by + 110}" fill="none" stroke="${bow}" stroke-width="14" stroke-linecap="round"/>
<path d="M${n(bx - 120)} ${by - 110} L${n(bx - 120)} ${by + 110}" stroke="${p.ink}" stroke-width="3" opacity=".5"/>
<circle cx="${n(bx - 120)}" cy="${by - 110}" r="9" fill="${GOLD}"/><circle cx="${n(bx - 120)}" cy="${by + 110}" r="9" fill="${GOLD}"/>`;
  s += marigold(bx - 34, by, 22, '#ff8f1f');
  for (const side of [-1, 1]) s += at(sx + side * between(r, 300, 380), between(r, 190, 260), 1, flower(0, 0, 8, 56, 28, [pick(r, p.acc)], GOLD, r() * 3, 12));
  return s;
};

// ---- Mahavir Jayanti ----

/** Mahavir Jayanti A: lotuses on a calm pond, a dove with a leaf above. */
const lotusPond: Design = (r, p) => {
  let s = `<ellipse cx="540" cy="560" rx="500" ry="90" fill="${p.acc[2]}" opacity=".45"/><ellipse cx="540" cy="560" rx="500" ry="90" fill="none" stroke="#fff" stroke-width="5"/>`;
  for (let i = 0; i < 4; i++) {
    const x = between(r, 130, 950), y = between(r, 520, 620);
    s += `<path d="M${n(x)} ${n(y)} q30 -10 60 0" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>`;
  }
  const pads = whole(r, 2, 3);
  for (let i = 0; i < pads; i++) {
    const x = between(r, 120, 260) + i * 330;
    s += `<path d="M${n(x)} ${n(600)} m-60 0 a60 22 0 1 0 120 0 a60 22 0 0 0 -50 -18 l-10 18 l-10 -18 a60 22 0 0 0 -50 18 z" fill="${GREEN}" ${OUTLINE}/>`;
  }
  const main = pick(r, p.acc);
  s += at(540, 540, 1.25, lotus(main));
  s += at(between(r, 260, 300), 575, 0.8, lotus(p.acc[(p.acc.indexOf(main) + 1) % p.acc.length]));
  s += at(between(r, 780, 820), 575, 0.8, lotus(p.acc[(p.acc.indexOf(main) + 3) % p.acc.length]));
  const left = r() < 0.5;
  s += at(left ? between(r, 230, 300) : between(r, 780, 850), between(r, 150, 200), 0.9, dove(p), !left);
  for (let i = 0; i < 4; i++) s += leaf(between(r, 120, 960), between(r, 60, 300), 34, pick(r, [GREEN, LEAF]), between(r, -80, 80));
  return s;
};

/** A sitting rabbit facing right; (0, 0) is the middle of its feet. */
const rabbit = (p: Palette) =>
  `<ellipse cx="34" cy="-182" rx="14" ry="44" fill="#fff" ${soft(p)} transform="rotate(-12 34 -182)"/>
<ellipse cx="64" cy="-178" rx="14" ry="44" fill="#fff" ${soft(p)} transform="rotate(14 64 -178)"/>
<ellipse cx="34" cy="-182" rx="6" ry="30" fill="#ffc1d2" transform="rotate(-12 34 -182)"/>
<ellipse cx="64" cy="-178" rx="6" ry="30" fill="#ffc1d2" transform="rotate(14 64 -178)"/>
<circle cx="-62" cy="-42" r="18" fill="#fff" ${soft(p)}/>
<ellipse cx="0" cy="-56" rx="66" ry="56" fill="#fff" ${soft(p)}/>
<circle cx="50" cy="-118" r="42" fill="#fff" ${soft(p)}/>
<circle cx="66" cy="-124" r="5.5" fill="${p.ink}"/><circle cx="90" cy="-110" r="6" fill="#ff8fab"/>
<ellipse cx="34" cy="-4" rx="26" ry="10" fill="#fff" ${soft(p)}/>`;

/** A tortoise walking right; (0, 0) is the middle of its feet. */
const tortoise = (p: Palette, shell: string) =>
  `<ellipse cx="-50" cy="-8" rx="18" ry="12" fill="#a5d17a" ${OUTLINE}/><ellipse cx="50" cy="-8" rx="18" ry="12" fill="#a5d17a" ${OUTLINE}/>
<path d="M60 -40 q40 -30 62 0 q4 20 -24 20 z" fill="#a5d17a" ${OUTLINE}/><circle cx="104" cy="-38" r="5" fill="${p.ink}"/>
<path d="M-90 -18 Q-90 -116 0 -116 Q90 -116 90 -18 Z" fill="${shell}" ${OUTLINE}/>
<path d="M-30 -86 l30 -14 l30 14 v26 l-30 14 l-30 -14 z" fill="#fff" opacity=".35"/>
<path d="M-74 -40 l26 -12 M74 -40 l-26 -12" stroke="#fff" stroke-width="5" opacity=".5" stroke-linecap="round"/>
<rect x="-96" y="-26" width="192" height="16" rx="8" fill="${shell}" ${OUTLINE}/>`;

/** Mahavir Jayanti B: a leafy tree where birds, a rabbit and a tortoise share the shade. */
const kindTree: Design = (r, p) => {
  const tx = between(r, 520, 560);
  let s = grass(r, LEAF, 650);
  s += `<path d="M${n(tx - 34)} 640 Q${n(tx - 20)} 420 ${n(tx - 10)} 330 h20 Q${n(tx + 20)} 420 ${n(tx + 34)} 640 Z" fill="#8d5a3b" ${OUTLINE}/>`;
  const blobs = [[0, 210, 150], [-150, 250, 110], [150, 250, 110], [-90, 140, 110], [90, 140, 110], [0, 110, 100]];
  for (const [dx, y, R] of blobs) s += `<circle cx="${n(tx + dx)}" cy="${y}" r="${R}" fill="#fff"/>`;
  for (const [dx, y, R] of blobs) s += `<circle cx="${n(tx + dx)}" cy="${y}" r="${R - 5}" fill="${GREEN}"/>`;
  for (let i = 0; i < 6; i++) s += `<circle cx="${n(tx + between(r, -200, 200))}" cy="${n(between(r, 90, 300))}" r="${n(between(r, 12, 20))}" fill="${LEAF}"/>`;
  const birds = [[-170, 300, false], [130, 170, true], [20, 70, false]] as const;
  birds.forEach(([dx, y, flip], i) => {
    if (i < 2 || r() < 0.6) s += at(tx + dx + between(r, -10, 10), y, 0.9, bird(p.acc[(i * 2) % p.acc.length], p.ink), flip);
  });
  s += at(tx - between(r, 250, 300), 640, between(r, 0.85, 0.95), rabbit(p));
  s += at(tx + between(r, 230, 290), 640, 0.9, tortoise(p, pick(r, p.acc)), true);
  // a little water bowl shared by all
  s += `<ellipse cx="${n(tx)}" cy="632" rx="70" ry="16" fill="#c58b2c" ${OUTLINE}/><ellipse cx="${n(tx)}" cy="626" rx="54" ry="8" fill="${p.acc[2]}" opacity=".8"/>`;
  s += at(tx + 60, 590, 0.6, bird(pick(r, p.acc), p.ink), true);
  for (let i = 0; i < 3; i++) s += leaf(between(r, 80, 1000), between(r, 380, 500), 30, pick(r, [GREEN, LEAF]), between(r, -80, 80));
  return s;
};

// ---- Eid al-Fitr ----

/** Eid A: a crescent moon and star with hanging lanterns. */
const moonLanterns: Design = (r, p) => {
  let s = '';
  for (let i = 0; i < 14; i++) s += sparkle(between(r, 60, 1020), between(r, 40, 620), between(r, 8, 16), pick(r, [GOLD, ...p.acc]));
  const mx = between(r, 470, 610), my = between(r, 300, 340);
  s += at(mx, my, 1, crescent(165, GOLD), false, between(r, -25, -5));
  s += star(mx + 70, my - 30, 52, GOLD, between(r, -0.2, 0.2));
  const count = whole(r, 2, 3);
  const xs = count === 2 ? [between(r, 160, 220), between(r, 860, 920)] : [between(r, 130, 180), between(r, 300, 330), between(r, 880, 930)];
  xs.forEach((x, i) => (s += fanoos(x, between(r, 120, 260), p.acc[(i * 2 + 1) % p.acc.length], p.ink)));
  for (let i = 0; i < 4; i++) s += star(between(r, 120, 960), between(r, 450, 610), between(r, 14, 22), pick(r, p.acc));
  return s;
};

/** Eid B: a domed mosque at dusk under a crescent moon, with plates of sweets and gifts. */
const mosque: Design = (r, p) => {
  const cx = between(r, 520, 560), wall = pick(r, p.acc), dome = pick(r, p.acc.filter((c) => c !== wall));
  let s = '';
  for (let i = 0; i < 10; i++) s += star(between(r, 60, 1020), between(r, 40, 220), between(r, 8, 15), GOLD);
  s += at(between(r, 820, 920), between(r, 100, 130), 1, crescent(60, GOLD), false, -15);
  for (const side of [-1, 1]) {
    const mx = cx + side * 250;
    s += `<rect x="${n(mx - 22)}" y="250" width="44" height="370" rx="6" fill="${wall}" ${OUTLINE}/>
<rect x="${n(mx - 34)}" y="330" width="68" height="20" rx="6" fill="${dome}" ${OUTLINE}/>
<path d="M${n(mx - 26)} 252 Q${n(mx)} 190 ${n(mx + 26)} 252 Z" fill="${dome}" ${OUTLINE}/>
<path d="M${n(mx)} 200 v-28" stroke="${GOLD}" stroke-width="5" stroke-linecap="round"/>
<path d="M${n(mx - 9)} 280 v24 a9 9 0 0 1 18 0 v-24 z" fill="${CREAM}"/>`;
  }
  s += `<rect x="${n(cx - 200)}" y="440" width="400" height="180" rx="8" fill="${wall}" ${OUTLINE}/>
<rect x="${n(cx - 110)}" y="390" width="220" height="56" rx="6" fill="${wall}" ${OUTLINE}/>
<path d="M${n(cx - 120)} 394 C${n(cx - 130)} 290 ${n(cx - 20)} 270 ${n(cx)} 210 C${n(cx + 20)} 270 ${n(cx + 130)} 290 ${n(cx + 120)} 394 Z" fill="${dome}" ${OUTLINE}/>
<path d="M${n(cx)} 212 v-30" stroke="${GOLD}" stroke-width="6" stroke-linecap="round"/>`;
  s += at(cx + 6, 168, 1, crescent(16, GOLD).replace(OUTLINE, ''), false, -30);
  s += `<path d="M${n(cx - 36)} 620 v-80 a36 36 0 0 1 72 0 v80 z" fill="${CREAM}"/>`;
  for (const dx of [-140, -80, 80, 140]) s += `<path d="M${n(cx + dx - 16)} 540 v-40 a16 16 0 0 1 32 0 v40 z" fill="${CREAM}"/>`;
  for (const dx of [-60, -20, 20, 60]) s += `<circle cx="${n(cx + dx)}" cy="418" r="8" fill="${CREAM}"/>`;
  s += sweets(between(r, 140, 190), 630, r, pick(r, ['#f4a62a', '#ffb300', '#ff8f1f']));
  s += gift(between(r, 800, 830), 548, 90, 80, pick(r, p.acc)) + gift(between(r, 910, 930), 568, 70, 60, pick(r, p.acc));
  return s;
};

export const sankranti: Design[] = [kites, pongalPot];
export const holi: Design[] = [colourClouds, pichkari];
export const ugadi: Design[] = [ugadiKolam, pachadi];
export const goodFriday: Design[] = [hillCross, candle];
export const ramNavami: Design[] = [cradle, bowAndSun];
export const mahavirJayanti: Design[] = [lotusPond, kindTree];
export const eid: Design[] = [moonLanterns, mosque];
export const diwali: Design[] = [rangoli, skyLanterns];
export const christmas: Design[] = [tree, snowman];
