// Colour themes and how the site rotates between them. The colours live in src/styles/global.css
// (Pastel Glass, the default) and src/styles/themes.css; the choice of theme is made in the admin
// panel (Site settings → Look and feel) and applied in the browser by layouts/BaseLayout.astro.

export const themes = [
  { id: 'pastel', label: 'Pastel Glass', fonts: 'family=Fredoka:wght@500;600&family=Nunito:wght@400;600;700;800', color: '#0b1d5e' },
  { id: 'meadow', label: 'Sunny Meadow', fonts: 'family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700;800', color: '#1b5a2b' },
  { id: 'ocean', label: 'Ocean Breeze', fonts: 'family=Quicksand:wght@600;700&family=Nunito:wght@400;600;700;800', color: '#0a4f70' },
  { id: 'crayon', label: 'Crayon Box', fonts: 'family=Grandstander:wght@600;700&family=Nunito:wght@400;600;700;800', color: '#b8261a' },
  { id: 'calm', label: 'Montessori Calm', fonts: 'family=Lexend:wght@400;500;600;700', color: '#3b5537' },
] as const;

export type ThemeId = (typeof themes)[number]['id'];

export const themeModes = [
  { value: 'fixed', label: 'The same theme every day' },
  { value: 'weekday', label: 'A set theme for each day of the week' },
  { value: 'daily', label: 'A different theme each day, in turn' },
  { value: 'visit', label: 'A random theme on every visit' },
  { value: 'returning', label: 'A random theme for each new visitor, kept on their repeat visits' },
] as const;

export type ThemeMode = (typeof themeModes)[number]['value'];

export const weekdays = [
  ['mon', 'Monday'],
  ['tue', 'Tuesday'],
  ['wed', 'Wednesday'],
  ['thu', 'Thursday'],
  ['fri', 'Friday'],
  ['sat', 'Saturday'],
  ['sun', 'Sunday'],
] as const;

export interface ThemeSettings {
  mode: ThemeMode;
  /** The theme for "fixed", and the fallback for everything else. */
  fixed: ThemeId;
  /** The themes "daily", "visit" and "returning" choose from, in this order. */
  rotation: ThemeId[];
  /** One theme per day of the week, for "weekday". */
  weekdays: Record<(typeof weekdays)[number][0], ThemeId>;
}

export const fontsHref = (fonts: string) => `https://fonts.googleapis.com/css2?${fonts}&display=swap`;

const ids = themes.map((t) => t.id) as string[];
const isTheme = (value: unknown): value is ThemeId => typeof value === 'string' && ids.includes(value);

/** Cleans up the settings from the admin panel, so a half-filled form still gives a working site. */
export function themeSettings(raw: Partial<Record<keyof ThemeSettings, unknown>> | undefined): ThemeSettings {
  const mode = themeModes.some((m) => m.value === raw?.mode) ? (raw!.mode as ThemeMode) : 'fixed';
  const fixed = isTheme(raw?.fixed) ? raw.fixed : 'pastel';
  const picked = Array.isArray(raw?.rotation) ? ids.filter((id) => (raw.rotation as unknown[]).includes(id)) : [];
  const days = (raw?.weekdays ?? {}) as Record<string, unknown>;
  return {
    mode,
    fixed,
    rotation: (picked.length ? picked : [fixed]) as ThemeId[],
    weekdays: Object.fromEntries(weekdays.map(([day]) => [day, isTheme(days[day]) ? days[day] : fixed])) as ThemeSettings['weekdays'],
  };
}
