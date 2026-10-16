// What a theme's set of doodles looks like. Each theme draws its own (pastel.ts, meadow.ts, …), and
// index.ts turns them into small SVG files and the CSS that puts the right set on the page.

/** Main colour, then a shade for details. */
export type Colors = [string, string];

/** One doodle: the inner markup of an SVG with a 100 × 100 viewBox, by day and at night (dark mode). */
export interface Doodle {
  day: string;
  night: string;
}

/**
 * A theme's doodles. Where they sit, how big they are and how they move is the same in every theme
 * (FloatingShapes.astro for the banners, global.css for the sections), so a theme only draws them.
 */
export interface ThemeDoodles {
  /**
   * The home page banner: a big one drifting side to side along the top (120px), a small one bobbing
   * at the top right (58px), one bobbing at the left edge (50px) and one drifting near the bottom (46px).
   */
  home: [Doodle, Doodle, Doodle, Doodle];
  /** Other page banners: a big one drifting (104px), a small one spinning (32px) and one bobbing at the right (46px). */
  page: [Doodle, Doodle, Doodle];
  /** One in the page margin beside each section, in a six-step cycle down the page (52–104px). */
  sections: [Doodle, Doodle, Doodle, Doodle, Doodle, Doodle];
  /** The wavy underline under the highlighted words of the home page title: a path in a 120 × 12 box. */
  underline: string;
}

/** A doodle drawn by `draw` in its day colours and in its night colours. */
export const doodle = (draw: (colors: Colors, atNight: boolean) => string, day: Colors, night: Colors): Doodle => ({
  day: draw(day, false),
  night: draw(night, true),
});
