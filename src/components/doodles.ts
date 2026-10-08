// Playful preschool doodles (crayons, ABC blocks, kites, rainbows…) drawn as small SVGs in a
// 100 × 100 box. FloatingShapes.astro draws them inline in the page banners, and BaseLayout turns
// sectionDoodleCss into the two drifting doodles behind every page section (see global.css).

export type DoodleKind =
  | 'abacus'
  | 'balloon'
  | 'block'
  | 'book'
  | 'cloud'
  | 'crayon'
  | 'kite'
  | 'note'
  | 'pencil'
  | 'plane'
  | 'puzzle'
  | 'rainbow'
  | 'star'
  | 'sun';

/** Main colour, then a shade for details. Pastel enough to sit quietly behind text. */
export type Colors = [string, string];

export const pastel = {
  pink: ['#ffc7da', '#ffa9c4'],
  lavender: ['#d6caff', '#bfaeff'],
  mint: ['#bfeacf', '#9fdcb8'],
  peach: ['#ffd2bd', '#ffb999'],
  sky: ['#c3defe', '#a5ccfc'],
  butter: ['#ffe59a', '#ffd463'],
} satisfies Record<string, Colors>;

const LETTER_FONT = "Fredoka, 'Arial Rounded MT Bold', Arial, sans-serif";

/** Inner SVG markup (no <svg> wrapper) for a doodle. */
export function doodle(kind: DoodleKind, [main, shade]: Colors, letter = 'A'): string {
  switch (kind) {
    case 'abacus':
      return (
        `<rect x="12" y="14" width="76" height="72" rx="10" fill="none" stroke="${shade}" stroke-width="7"/>` +
        [32, 50, 68]
          .map(
            (y, row) =>
              `<path d="M16 ${y}h68" stroke="${shade}" stroke-width="3"/>` +
              [0, 1, 2]
                .map((i) => `<circle cx="${26 + i * 13 + (row % 2) * 22}" cy="${y}" r="6.5" fill="${['#ffa9c4', '#ffd463', '#a5ccfc'][(i + row) % 3]}"/>`)
                .join(''),
          )
          .join('')
      );
    case 'balloon':
      return (
        `<ellipse cx="50" cy="38" rx="27" ry="32" fill="${main}"/><path d="M50 70l-5 7h10z" fill="${main}"/>` +
        `<path d="M50 77c-6 8 6 12 0 20" fill="none" stroke="${shade}" stroke-width="2.5" stroke-linecap="round"/>` +
        `<ellipse cx="40" cy="28" rx="6" ry="9" fill="#fff" fill-opacity=".5"/>`
      );
    case 'block':
      return (
        `<path d="M14 30l14-14h58l-14 14z" fill="${shade}"/><path d="M72 30l14-14v56l-14 14z" fill="${shade}" fill-opacity=".75"/>` +
        `<rect x="14" y="30" width="58" height="56" rx="6" fill="${main}"/>` +
        `<text x="43" y="73" text-anchor="middle" font-family="${LETTER_FONT}" font-weight="700" font-size="40" fill="#fff">${letter}</text>`
      );
    case 'book':
      return (
        `<path d="M50 26c-12-8-28-8-40-4v56c12-4 28-4 40 4z" fill="${main}"/>` +
        `<path d="M50 26c12-8 28-8 40-4v56c-12-4-28-4-40 4z" fill="${shade}"/>` +
        `<path d="M18 36c8-3 16-3 24 1M18 46c8-3 16-3 24 1M18 56c8-3 16-3 24 1M58 37c8-4 16-4 24-1M58 47c8-4 16-4 24-1M58 57c8-4 16-4 24-1" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-opacity=".85"/>`
      );
    case 'cloud':
      return `<path d="M27 74h48a17 17 0 0 0 1-34 24 24 0 0 0-46-7 20 20 0 0 0-3 41z" fill="${main}"/>`;
    case 'crayon':
      return (
        `<g transform="rotate(-35 50 50)"><rect x="12" y="39" width="62" height="22" rx="5" fill="${main}"/>` +
        `<path d="M74 40l17 10-17 10z" fill="${shade}"/><rect x="22" y="39" width="7" height="22" fill="${shade}"/>` +
        `<rect x="58" y="39" width="7" height="22" fill="${shade}"/><rect x="34" y="46" width="18" height="8" rx="4" fill="#fff" fill-opacity=".6"/></g>`
      );
    case 'kite':
      return (
        `<path d="M50 6l28 34-28 34-28-34z" fill="${main}"/><path d="M50 6l28 34H50zM50 40H22l28 34z" fill="${shade}"/>` +
        `<path d="M50 74c-8 6 8 10 0 16" fill="none" stroke="${shade}" stroke-width="3" stroke-linecap="round"/>` +
        `<path d="M42 80l8 3-8 3zM58 88l-8 3 8 3z" fill="${shade}"/>`
      );
    case 'note':
      return (
        `<path d="M40 74V24l42-10v50" fill="none" stroke="${main}" stroke-width="8" stroke-linejoin="round"/>` +
        `<path d="M40 34l42-10" stroke="${shade}" stroke-width="8"/>` +
        `<ellipse cx="29" cy="76" rx="13" ry="10" fill="${main}"/><ellipse cx="71" cy="66" rx="13" ry="10" fill="${main}"/>`
      );
    case 'pencil':
      return (
        `<g transform="rotate(35 50 50)"><rect x="6" y="41" width="12" height="18" rx="4" fill="#ffc2d4"/>` +
        `<rect x="17" y="41" width="7" height="18" fill="#dfe2ef"/><rect x="24" y="41" width="48" height="18" fill="${main}"/>` +
        `<rect x="24" y="47" width="48" height="6" fill="${shade}"/><path d="M72 41l18 9-18 9z" fill="#ffe3c4"/>` +
        `<path d="M84 47l6 3-6 3z" fill="#8d96bd"/></g>`
      );
    case 'plane':
      return (
        `<path d="M6 46L94 12 58 90 44 60z" fill="${main}"/><path d="M44 60L94 12 52 70z" fill="${shade}"/>` +
        `<path d="M8 82c10-8 18 2 28-8" fill="none" stroke="${shade}" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 7"/>`
      );
    case 'puzzle':
      return `<path d="M18 30h18a9 9 0 1 1 18 0h18v18a9 9 0 1 1 0 18v18H54a9 9 0 1 0-18 0H18z" fill="${main}" stroke="${shade}" stroke-width="3" stroke-linejoin="round"/>`;
    case 'rainbow':
      return (
        [
          [40, '#ffb3cb'],
          [31, '#ffd98a'],
          [22, '#aee3c3'],
          [13, '#b4d3fd'],
        ]
          .map(([r, c]) => `<path d="M${50 - Number(r)} 72a${r} ${r} 0 0 1 ${2 * Number(r)} 0" fill="none" stroke="${c}" stroke-width="8"/>`)
          .join('') +
        `<path d="M4 78a8 8 0 0 1 10-10 9 9 0 0 1 16 2 7 7 0 0 1-2 8zM70 78a8 8 0 0 1 10-10 9 9 0 0 1 16 2 7 7 0 0 1-2 8z" fill="#fff"/>`
      );
    case 'star':
      return `<path d="M50 8l12 25 27 4-20 19 5 27-24-13-24 13 5-27-20-19 27-4z" fill="${main}" stroke="${main}" stroke-width="8" stroke-linejoin="round"/>`;
    case 'sun':
      return (
        `<g stroke="${shade}" stroke-width="7" stroke-linecap="round">` +
        [0, 45, 90, 135, 180, 225, 270, 315]
          .map((deg) => {
            const a = (deg * Math.PI) / 180;
            const p = (r: number) => `${(50 + r * Math.cos(a)).toFixed(1)} ${(50 + r * Math.sin(a)).toFixed(1)}`;
            return `<path d="M${p(35)}L${p(44)}"/>`;
          })
          .join('') +
        `</g><circle cx="50" cy="50" r="25" fill="${main}"/>` +
        `<path d="M40 54c5 6 15 6 20 0" fill="none" stroke="#e0a100" stroke-width="3.5" stroke-linecap="round"/>` +
        `<circle cx="41" cy="45" r="3" fill="#e0a100"/><circle cx="59" cy="45" r="3" fill="#e0a100"/>`
      );
  }
}

const dataUri = (inner: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${inner}</svg>`)}")`;

/** The two doodles behind each section, in the same six-step cycle as the section colours. */
const sectionDoodles: [string, string][] = [
  [doodle('crayon', pastel.sky), doodle('block', pastel.butter, 'A')], // pink
  [doodle('rainbow', pastel.pink), doodle('puzzle', pastel.mint)], // lavender
  [doodle('plane', pastel.lavender), doodle('sun', pastel.butter)], // mint
  [doodle('kite', pastel.sky), doodle('pencil', pastel.butter)], // peach
  [doodle('book', pastel.peach), doodle('block', pastel.pink, 'B')], // sky
  [doodle('abacus', pastel.lavender), doodle('star', pastel.pink)], // butter
];

export const sectionDoodleCss = sectionDoodles
  .map(([a, b], i) => {
    const nth = i === 5 ? '6n' : `6n+${i + 1}`;
    return `main > section:nth-of-type(${nth}){--shape-1:${dataUri(a)};--shape-2:${dataUri(b)}}`;
  })
  .join('\n');
