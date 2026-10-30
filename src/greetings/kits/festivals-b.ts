// Diwali's symbols for the card maker (src/greetings/maker.ts): the worked example the other kits follow.
// Every piece is drawn in a 200 × 200 box centred on (0, 0), inside −95…95.
import type { Kit, Piece } from '../maker';
import { burst, diya, flower, n, OUTLINE, sparkle } from '../motifs';
import { between, pick, whole } from '../palettes';

/** A clay diya with its flame. */
const lamp: Piece = () => `<g transform="translate(0 40) scale(1.25)">${diya(0, 0)}</g>`;

/** A round rangoli of petals and dots. */
const rangoli: Piece = (r, p) => {
  const petals = 8 + 2 * whole(r, 0, 2), rot = r() * Math.PI;
  let s = flower(0, 0, petals, 120, 42, p.acc, '#ffc93c', rot, 34);
  s += flower(0, 0, petals, 80, 30, [...p.acc.slice(2), ...p.acc.slice(0, 2)], '#ffc93c', rot + Math.PI / petals, 30);
  for (let i = 0; i < 16; i++) {
    const a = (2 * Math.PI * i) / 16;
    s += `<circle cx="${n(Math.cos(a) * 86)}" cy="${n(Math.sin(a) * 86)}" r="6" fill="${pick(r, p.acc)}"/>`;
  }
  return s;
};

/** A sky lantern (akash kandil) with tassels. */
const kandil: Piece = (r, p) => {
  const c = pick(r, p.acc);
  return `<line x1="0" y1="-95" x2="0" y2="-62" stroke="${p.ink}" stroke-width="4" opacity=".45"/>
<path d="M0 -64 L52 -10 L0 44 L-52 -10 Z" fill="${c}" ${OUTLINE}/>
<path d="M-52 -10 H52 M0 -64 V44" stroke="#fff4c2" stroke-width="5"/>
<path d="M-26 44 L0 70 L26 44" fill="#ffc93c" ${OUTLINE}/>
<path d="M-12 70 v24 M0 72 v22 M12 70 v24" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`;
};

/** A firework burst. */
const firework: Piece = (r, p) => burst(0, 0, between(r, 62, 76), pick(r, p.acc), whole(r, 10, 14)) + sparkle(0, 0, 18, '#fff');

/** A plate of round sweets (laddoos). */
const sweets: Piece = () => {
  let s = `<ellipse cx="0" cy="44" rx="88" ry="26" fill="#c9ccd6" ${OUTLINE}/>`;
  for (const [x, y] of [[-46, 22], [0, 22], [46, 22], [-23, -10], [23, -10], [0, -40]]) s += `<circle cx="${x}" cy="${y}" r="26" fill="#ffa62b" ${OUTLINE}/><circle cx="${x - 8}" cy="${y - 8}" r="5" fill="#fff4c2"/>`;
  return s;
};

/** A marigold flower. */
const marigold: Piece = () => flower(0, 0, 14, 90, 34, ['#ff9f1c', '#ffbf47'], '#e8590c', 0, 26);

const diwaliKit: Kit = {
  hero: [lamp, rangoli, sweets],
  small: [lamp, kandil, firework, marigold, sweets],
  hang: [kandil, marigold],
};

export const festivalKitsB: Record<string, Kit> = { diwali: diwaliKit };
