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
/** A batch has to end after it starts, on the same day. */
export const endsAfterStart = (from: unknown, to: unknown) => isTime(from) && isTime(to) && minutes(to) > minutes(from);

/** "09:00" → "9:00 am", "12:30" → "12:30 pm". */
export function formatTime(hhmm: string): string {
  if (!isTime(hhmm)) return hhmm;
  const h = Number(hhmm.slice(0, 2));
  return `${h % 12 || 12}:${hhmm.slice(3)} ${h < 12 ? 'am' : 'pm'}`;
}

/** The two ends of a time range as shown: ["9:00", "11:30 am"] when both fall in the morning (or afternoon), else ["9:00 am", "12:30 pm"]. */
export function rangeParts(from: string, to: string): [string, string] {
  const [a, b] = [formatTime(from), formatTime(to)];
  return [a.slice(-2) === b.slice(-2) ? a.slice(0, -3) : a, b];
}

/** "9:00 – 11:30 am", "9:00 am – 12:30 pm". */
export const formatRange = (from: string, to: string) => rangeParts(from, to).join(' – ');

const order = weekdays.map(([key]) => key) as DayKey[];
const short = (key: DayKey) => weekdays.find(([k]) => k === key)![1].slice(0, 3);
const dayName = (key: DayKey) => weekdays.find(([k]) => k === key)![1];

/** ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] → "Mon – Sat"; ['mon', 'wed', 'fri'] → "Mon, Wed, Fri"; ['sat', 'sun', 'mon'] → "Sat – Mon". */
export function formatDays(days: readonly string[] = []): string {
  const picked = order.filter((d) => days.includes(d));
  if (picked.length === 7) return 'Every day';
  const runs: DayKey[][] = [];
  for (const day of picked) {
    const run = runs.at(-1);
    if (run && order.indexOf(day) === order.indexOf(run.at(-1)!) + 1) run.push(day);
    else runs.push([day]);
  }
  // Sunday runs on into Monday, when that makes a range ("Sat – Mon") out of shorter pieces.
  const [first, last] = [runs[0], runs.at(-1)];
  if (runs.length > 1 && first![0] === 'mon' && last!.at(-1) === 'sun' && first!.length + last!.length > 2 && (first!.length < 3 || last!.length < 3))
    runs.unshift([...runs.pop()!, ...runs.shift()!]);
  return runs.map((run) => (run.length > 2 ? `${short(run[0]!)} – ${short(run.at(-1)!)}` : run.map(short).join(', '))).join(', ');
}

/**
 * Cleans up batches from the admin panel: drops half-filled ones and ones that end before they start,
 * keeps one of any repeated batch (the one with a seats label), caps names at 40 characters and sorts by
 * start time.
 */
export function cleanBatches(raw: unknown): Batch[] {
  const kept = new Map<string, Batch>();
  const batches = (Array.isArray(raw) ? raw : [])
    .filter((b): b is Record<string, unknown> => !!b && typeof b === 'object')
    .filter((b) => typeof b.program === 'string' && b.program && endsAfterStart(b.from, b.to))
    .map((b): Batch => ({
      program: b.program as string,
      name: typeof b.name === 'string' ? b.name.trim().slice(0, 40) : '',
      from: b.from as string,
      to: b.to as string,
      days: Array.isArray(b.days) ? order.filter((d) => (b.days as unknown[]).includes(d)) : [],
      seats: b.seats === 'few' || b.seats === 'full' ? b.seats : '',
    }));
  for (const b of batches) {
    const key = JSON.stringify([b.program, b.name, b.from, b.to, b.days]);
    if (!kept.has(key) || (b.seats && !kept.get(key)!.seats)) kept.set(key, b);
  }
  return [...kept.values()].sort((a, b) => minutes(a.from) - minutes(b.from));
}

const earliest = (batches: Batch[]) => batches.map((b) => b.from).sort((a, b) => minutes(a) - minutes(b))[0]!;
const latest = (batches: Batch[]) => batches.map((b) => b.to).sort((a, b) => minutes(b) - minutes(a))[0]!;

/**
 * When a branch is open. Until every batch says which days it runs: one range, from the earliest start
 * to the latest end, with no days. Then, for each day, its earliest start and latest end, with days of
 * equal hours grouped: [{ days: "Mon – Fri", from: "09:00", to: "19:00" }, { days: "Sat", … }].
 */
export function openingTimes(batches: Batch[]): { days: string; dayKeys: DayKey[]; from: string; to: string }[] {
  if (!batches.length) return [];
  if (!batches.every((b) => b.days?.length)) return [{ days: '', dayKeys: [], from: earliest(batches), to: latest(batches) }];
  const groups: { dayKeys: DayKey[]; from: string; to: string }[] = [];
  for (const day of order) {
    const that = batches.filter((b) => b.days!.includes(day));
    if (!that.length) continue;
    const [from, to] = [earliest(that), latest(that)];
    const same = groups.find((g) => g.from === from && g.to === to);
    if (same) same.dayKeys.push(day);
    else groups.push({ dayKeys: [day], from, to });
  }
  return groups.map((g) => ({ ...g, days: formatDays(g.dayKeys) }));
}

/** The same opening hours for Google (schema.org OpeningHoursSpecification); empty until every batch has its days. */
export const openingHoursSpecification = (batches: Batch[]) =>
  openingTimes(batches)
    .filter((t) => t.dayKeys.length)
    .map((t) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: t.dayKeys.map(dayName), opens: t.from, closes: t.to }));

/** The label a batch has in the enquiry form: "Morning · 9:00 – 11:30 am". */
export const batchLabel = (b: Batch) => [b.name, formatRange(b.from, b.to)].filter(Boolean).join(' · ');
