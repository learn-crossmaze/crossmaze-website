// Festival seasons for the site's festive touches (styles/seasons.css): a few days around Diwali and Holi
// (their dates from Google's calendar, src/greetings/dates.json, as for the greetings), Christmas to New Year,
// and the days before Independence Day and Republic Day. The browser picks today's by India's date.
import dates from '../greetings/dates.json';

export type SeasonId = 'diwali' | 'holi' | 'winter' | 'tricolour';
/** [season, first day, last day] as "YYYY-MM-DD". */
export type SeasonWindow = [SeasonId, string, string];

const shift = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);

export function seasonWindows(now = new Date()): SeasonWindow[] {
  const year = now.getFullYear();
  const events = dates.events as Record<string, string[]>;
  const list: SeasonWindow[] = [];
  for (const d of events['Diwali/Deepavali'] ?? []) list.push(['diwali', shift(d, -4), shift(d, 2)]);
  for (const d of events['Holi'] ?? []) list.push(['holi', shift(d, -2), d]);
  // Built pages are published often, but a few years ahead keeps these working if they aren't.
  for (let y = year - 1; y <= year + 5; y++) {
    list.push(['winter', `${y}-12-20`, `${y + 1}-01-01`]);
    list.push(['tricolour', `${y}-01-23`, `${y}-01-26`]);
    list.push(['tricolour', `${y}-08-12`, `${y}-08-15`]);
  }
  return list.filter(([, , to]) => to >= `${year - 1}-12-01`).sort((a, b) => a[1].localeCompare(b[1]));
}
