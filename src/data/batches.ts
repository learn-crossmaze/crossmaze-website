// Timings at each branch. A branch runs one or more batches of each program it offers (a morning and
// an afternoon Play Group, full-day and half-day Day Care…), edited in the admin panel under the branch
// or by its branch admin. They are shown only on the branch's own page.
import { weekdays } from './themes';

export type DayKey = (typeof weekdays)[number][0];

export interface Batch {
  /** The program's slug (content/programs.json). */
  program: string;
  /** "Morning", "Full day"…; may be empty when the program has a single batch at the branch. */
  name?: string;
  /** 24-hour times, "09:00" and "12:30". */
  from: string;
  to: string;
  days?: DayKey[];
  /** Shown as a label on the branch page; empty shows nothing. */
  seats?: '' | 'few' | 'full';
}

export const seatLabels = { few: 'Few seats left', full: 'Full' } as const;

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const isTime = (value: unknown): value is string => typeof value === 'string' && TIME.test(value);
const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));

/** "09:00" → "9:00 am", "12:30" → "12:30 pm". */
export function formatTime(hhmm: string): string {
  if (!isTime(hhmm)) return hhmm;
  const h = Number(hhmm.slice(0, 2));
  return `${h % 12 || 12}:${hhmm.slice(3)} ${h < 12 ? 'am' : 'pm'}`;
}

/** "9:00 – 11:30 am" when both ends fall in the morning (or afternoon), else "9:00 am – 12:30 pm". */
export function formatRange(from: string, to: string): string {
  const [a, b] = [formatTime(from), formatTime(to)];
  return a.slice(-2) === b.slice(-2) ? `${a.slice(0, -3)} – ${b}` : `${a} – ${b}`;
}

const order = weekdays.map(([key]) => key) as DayKey[];
const short = (key: DayKey) => weekdays.find(([k]) => k === key)![1].slice(0, 3);

/** ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] → "Mon – Sat"; ['mon', 'wed', 'fri'] → "Mon, Wed, Fri". */
export function formatDays(days: readonly string[] = []): string {
  const picked = order.filter((d) => days.includes(d));
  if (picked.length === 7) return 'Every day';
  const runs: DayKey[][] = [];
  for (const day of picked) {
    const run = runs.at(-1);
    if (run && order.indexOf(day) === order.indexOf(run.at(-1)!) + 1) run.push(day);
    else runs.push([day]);
  }
  return runs.map((run) => (run.length > 2 ? `${short(run[0]!)} – ${short(run.at(-1)!)}` : run.map(short).join(', '))).join(', ');
}

/** Cleans up batches from the admin panel: drops half-filled ones and sorts by start time. */
export function cleanBatches(raw: unknown): Batch[] {
  return (Array.isArray(raw) ? raw : [])
    .filter((b): b is Record<string, unknown> => !!b && typeof b === 'object')
    .filter((b) => typeof b.program === 'string' && b.program && isTime(b.from) && isTime(b.to))
    .map((b): Batch => ({
      program: b.program as string,
      name: typeof b.name === 'string' ? b.name.trim() : '',
      from: b.from as string,
      to: b.to as string,
      days: Array.isArray(b.days) ? order.filter((d) => (b.days as unknown[]).includes(d)) : [],
      seats: b.seats === 'few' || b.seats === 'full' ? b.seats : '',
    }))
    .sort((a, b) => minutes(a.from) - minutes(b.from));
}

/** When a branch is open: the earliest start and latest end of its batches, and the days any of them run. */
export function openingHours(batches: Batch[]): { days: string; dayKeys: DayKey[]; from: string; to: string } | undefined {
  if (!batches.length) return undefined;
  const from = batches.map((b) => b.from).sort((a, b) => minutes(a) - minutes(b))[0]!;
  const to = batches.map((b) => b.to).sort((a, b) => minutes(b) - minutes(a))[0]!;
  const dayKeys = order.filter((d) => batches.some((b) => b.days?.includes(d)));
  return { days: formatDays(dayKeys), dayKeys, from, to };
}

/** The label a batch has in lists and the enquiry form: "Morning · 9:00 – 11:30 am". */
export const batchLabel = (b: Batch) => [b.name, formatRange(b.from, b.to)].filter(Boolean).join(' · ');

/**
 * The branch's opening hours for Google (schema.org OpeningHoursSpecification): for each day, the
 * earliest start and latest end of the batches that run that day, with days of equal hours grouped.
 * Empty until the batches say which days they run.
 */
export function openingHoursSpecification(batches: Batch[]) {
  const specs: { '@type': 'OpeningHoursSpecification'; dayOfWeek: string[]; opens: string; closes: string }[] = [];
  for (const [key, day] of weekdays) {
    const that = batches.filter((b) => b.days?.includes(key));
    if (!that.length) continue;
    const hours = openingHours(that)!;
    const same = specs.find((s) => s.opens === hours.from && s.closes === hours.to);
    if (same) same.dayOfWeek.push(day);
    else specs.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: [day], opens: hours.from, closes: hours.to });
  }
  return specs;
}
