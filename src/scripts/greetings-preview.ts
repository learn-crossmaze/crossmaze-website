// The festival greetings preview page (pages/greetings.astro): every occasion's card for a year, in date
// order, each opening its pop-up as visitors will see it.
import { indiaToday, nextDate, type DatesTable } from '../greetings/calendar';
import type { When } from '../greetings/types';

const raw = document.getElementById('greetings-preview')?.textContent;
const grid = document.getElementById('greetings-grid');
if (raw && grid) {
  const { schedule, dates } = JSON.parse(raw) as { schedule: { id: string; name: string; when: When }[]; dates: DatesTable };
  const thisYear = Number(indiaToday().slice(0, 4));
  const year = Number(new URLSearchParams(location.search).get('year')) || thisYear;

  const years = document.querySelector('.greetings-years');
  if (years)
    years.innerHTML = [thisYear, thisYear + 1, thisYear + 2]
      .map((y) => `<a class="btn btn--sm ${y === year ? '' : 'btn--ghost'}" href="/greetings?year=${y}" ${y === year ? 'aria-current="page"' : ''}>${y}</a>`)
      .join('');

  const days = schedule
    .map((o) => ({ ...o, date: nextDate(o, `${year}-01-01`, dates) }))
    .filter((o) => o.date?.startsWith(String(year)))
    .sort((a, b) => (a.date! < b.date! ? -1 : 1));
  const missing = schedule.filter((o) => !days.some((d) => d.id === o.id)).map((o) => o.name);
  const note = document.getElementById('greetings-note');
  if (note)
    note.textContent = `${days.length} greetings in ${year}.${missing.length ? ` No date yet in Google’s calendar for: ${missing.join(', ')}.` : ''}`;

  const label = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' });
  import('../greetings/ui').then(async ({ cardSvg, openGreeting }) => {
    const { occasionById } = await import('../greetings/occasions');
    const data = JSON.parse(document.getElementById('greet-data')?.textContent || '{"settings":{"admissions":true},"stories":{}}');
    for (const d of days) {
      const o = occasionById(d.id);
      if (!o) continue;
      const fig = document.createElement('figure');
      fig.innerHTML = `${await cardSvg(o, year)}<figcaption><span>${d.name}<small>${label(d.date!)}</small></span><button type="button" class="btn btn--sm btn--ghost">Open</button></figcaption>`;
      fig.querySelector('button')?.addEventListener('click', () => openGreeting([o.id], year, d.date!, data));
      grid.append(fig);
    }
  });
}
