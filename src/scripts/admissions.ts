// "Admissions open for 2027–28": the year is written when the site is built, and brought up to date here
// from the visitor's own date (in India), so it is right however long ago the site was last published.
import { admissionsYear } from '../greetings/calendar';

const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
const year = admissionsYear(today);
for (const el of document.querySelectorAll<HTMLElement>('[data-admissions-year]')) {
  if (el.textContent !== year) el.textContent = year;
}
