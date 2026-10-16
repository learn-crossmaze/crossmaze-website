// Pastel Glass: the original preschool doodles (clouds, kites, rainbows, ABC blocks…). Pastels by
// day; at night, mid-tone colours that glow softly on the dark page (dimmed pastels turn grey).
import { type Colors, type ThemeDoodles } from './shared';

type DoodleKind =
  | 'balloon'
  | 'block'
  | 'book'
  | 'cloud'
  | 'kite'
  | 'plane'
  | 'rainbow'
  | 'star'
  | 'sun';

/** Pastel enough to sit quietly behind text. */
const pastel = {
  pink: ['#ffc7da', '#ffa9c4'],
  lavender: ['#d6caff', '#bfaeff'],
  mint: ['#bfeacf', '#9fdcb8'],
  peach: ['#ffd2bd', '#ffb999'],
  sky: ['#c3defe', '#a5ccfc'],
  butter: ['#ffe59a', '#ffd463'],
} satisfies Record<string, Colors>;

/** The night versions of the pastels. */
const night = {
  pink: ['#f28db5', '#e46a9c'],
  lavender: ['#a78bfa', '#8b6cf0'],
  mint: ['#5cc996', '#3db07c'],
  peach: ['#f6a07a', '#ec8058'],
  sky: ['#74a7f0', '#5689e2'],
  butter: ['#f0c544', '#dca623'],
} satisfies Record<keyof typeof pastel, Colors>;

/** Inner SVG markup (no <svg> wrapper) for a doodle; `atNight` swaps its fixed details for night colours. */
function draw(kind: DoodleKind, [main, shade]: Colors, atNight = false): string {
  const n = (day: string, nightColour: string) => (atNight ? nightColour : day);
  switch (kind) {
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
        // A rounded letter A, drawn as a line: the files are images, so web fonts never load in them.
        `<path d="M31 73L43 42l12 31M35.5 63h15" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`
      );
    case 'book':
      return (
        `<path d="M50 26c-12-8-28-8-40-4v56c12-4 28-4 40 4z" fill="${main}"/>` +
        `<path d="M50 26c12-8 28-8 40-4v56c-12-4-28-4-40 4z" fill="${shade}"/>` +
        `<path d="M18 36c8-3 16-3 24 1M18 46c8-3 16-3 24 1M18 56c8-3 16-3 24 1M58 37c8-4 16-4 24-1M58 47c8-4 16-4 24-1M58 57c8-4 16-4 24-1" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-opacity=".85"/>`
      );
    case 'cloud':
      return `<path d="M27 74h48a17 17 0 0 0 1-34 24 24 0 0 0-46-7 20 20 0 0 0-3 41z" fill="${main}"/>`;
    case 'kite':
      return (
        `<path d="M50 6l28 34-28 34-28-34z" fill="${main}"/><path d="M50 6l28 34H50zM50 40H22l28 34z" fill="${shade}"/>` +
        `<path d="M50 74c-8 6 8 10 0 16" fill="none" stroke="${shade}" stroke-width="3" stroke-linecap="round"/>` +
        `<path d="M42 80l8 3-8 3zM58 88l-8 3 8 3z" fill="${shade}"/>`
      );
    case 'plane':
      return (
        `<path d="M6 46L94 12 58 90 44 60z" fill="${main}"/><path d="M44 60L94 12 52 70z" fill="${shade}"/>` +
        `<path d="M8 82c10-8 18 2 28-8" fill="none" stroke="${shade}" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 7"/>`
      );
    case 'rainbow':
      return (
        [
          [40, n('#ffb3cb', '#f28db5')],
          [31, n('#ffd98a', '#f0c544')],
          [22, n('#aee3c3', '#5cc996')],
          [13, n('#b4d3fd', '#74a7f0')],
        ]
          .map(([r, c]) => `<path d="M${50 - Number(r)} 72a${r} ${r} 0 0 1 ${2 * Number(r)} 0" fill="none" stroke="${c}" stroke-width="8"/>`)
          .join('') +
        `<path d="M4 78a8 8 0 0 1 10-10 9 9 0 0 1 16 2 7 7 0 0 1-2 8zM70 78a8 8 0 0 1 10-10 9 9 0 0 1 16 2 7 7 0 0 1-2 8z" fill="${n('#fff', '#dfe6f5')}"/>`
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
        `<path d="M40 54c5 6 15 6 20 0" fill="none" stroke="${n('#e0a100', '#9a6a00')}" stroke-width="3.5" stroke-linecap="round"/>` +
        `<circle cx="41" cy="45" r="3" fill="${n('#e0a100', '#9a6a00')}"/><circle cx="59" cy="45" r="3" fill="${n('#e0a100', '#9a6a00')}"/>`
      );
  }
}

const make = (kind: DoodleKind, colour: keyof typeof pastel) => ({
  day: draw(kind, pastel[colour]),
  night: draw(kind, night[colour], true),
});

export const pastelDoodles: ThemeDoodles = {
  home: [make('cloud', 'sky'), make('sun', 'butter'), make('balloon', 'pink'), make('plane', 'lavender')],
  page: [make('cloud', 'sky'), make('star', 'butter'), make('balloon', 'pink')],
  sections: [make('kite', 'sky'), make('rainbow', 'pink'), make('block', 'butter'), make('plane', 'lavender'), make('book', 'peach'), make('star', 'pink')],
  underline: 'M2 8 C 20 2, 40 2, 60 7 S 100 12, 118 4',
};
