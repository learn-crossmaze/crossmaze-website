import { useEffect, useMemo, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { admissionsYear, datesTable, indiaToday, nextDate } from '../../greetings/calendar';
import { CARD_FONTS, renderCard, turn, type Measure } from '../../greetings/card';
import dates from '../../greetings/dates.json';
import { occasions } from '../../greetings/occasions';
import { paletteFor } from '../../greetings/palettes';
import { textFor } from '../../greetings/text';
import { themes } from '../../data/themes';
import { markChanged, useDoc } from '../data';
import type { SiteContent } from '../../data/content';
import { PageHeader, Spinner, errorText, useSession, useToast } from './ui';

/**
 * Every festival greeting for a year (src/greetings), to check the cards and words before the day. On the day
 * itself the website shows the greeting by itself (components/Greetings.astro); this page is only here, behind
 * the sign-in, so nobody sees a greeting early. Each day can be switched off (site.greetings.off, read when the
 * website is published).
 */
export function GreetingsPage() {
  const { services, email } = useSession();
  const toast = useToast();
  const site = useDoc<SiteContent>(services.db, 'content/site');
  const off = site.data?.greetings?.off ?? [];
  const [saving, setSaving] = useState(false);
  const setOff = async (next: string[]) => {
    setSaving(true);
    try {
      await setDoc(doc(services.db, 'content/site'), { greetings: { off: next } }, { merge: true });
      await markChanged(services.db, email);
      toast('ok', 'Saved. Press Publish when you’re ready to update the website.');
    } catch (e) {
      toast('error', errorText(e));
    } finally {
      setSaving(false);
    }
  };
  const toggle = (id: string, show: boolean) => setOff(show ? off.filter((x) => x !== id) : [...new Set([...off, id])]);
  const thisYear = Number(indiaToday().slice(0, 4));
  const [year, setYear] = useState(thisYear);
  const [theme, setTheme] = useState<string>(themes[0].id);
  const [measure, setMeasure] = useState<Measure>();

  // The card's words are fitted with its own fonts, so wait for them.
  useEffect(() => {
    Promise.all([
      document.fonts.load(`700 40px '${CARD_FONTS.display}'`),
      document.fonts.load(`700 40px '${CARD_FONTS.text}'`),
      document.fonts.load(`800 40px '${CARD_FONTS.text}'`),
    ])
      .catch(() => undefined)
      .then(() => {
        const ctx = document.createElement('canvas').getContext('2d');
        setMeasure(() => (ctx ? (text: string, font: string) => ((ctx.font = font), ctx.measureText(text).width) : (text: string) => text.length * 18));
      });
  }, []);

  const table = useMemo(() => datesTable(dates.events, occasions), []);
  const days = useMemo(
    () =>
      occasions
        .map((o) => ({ o, date: nextDate(o, `${year}-01-01`, table) }))
        .filter((d): d is { o: (typeof occasions)[number]; date: string } => !!d.date?.startsWith(String(year)))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [year, table],
  );
  const missing = occasions.filter((o) => !days.some((d) => d.o.id === o.id));
  const label = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' });

  return (
    <>
      <PageHeader
        title="Festival greetings"
        intro="On each of these days the website greets visitors by itself: a bar at the top of every page, and a pop-up with the card, these words, the activity and the admissions line. Here you can see every greeting for a year before the day (dates from Google’s calendar of Indian holidays) and untick the ones the website should skip; they take effect when you press Publish. The colours follow the website's theme of the day."
      />
      <div className="card greetings-controls">
        <div className="field">
          <label htmlFor="greet-year">Year</label>
          <select id="greet-year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[thisYear, thisYear + 1, thisYear + 2].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="greet-theme">Colour theme</label>
          <select id="greet-theme" value={theme} onChange={(e) => setTheme(e.target.value)}>
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <p className="muted">
          {days.length} greetings in {year}, {days.filter((d) => !off.includes(d.o.id)).length} of them shown on the website.{missing.length ? ` No date yet in Google’s calendar for: ${missing.map((o) => o.name).join(', ')}.` : ''}
        </p>
      </div>
      {site.error && <p className="error">{site.error}</p>}
      {!measure || site.loading ? (
        <Spinner />
      ) : (
        <div className="greetings-list">
          {days.map(({ o, date }) => {
            const t = textFor(o.id, o.name);
            const svg = renderCard({ occasion: o, text: t, year, palette: paletteFor(theme, o.solemn), logo: '/logo.png', measure });
            const shown = !off.includes(o.id);
            return (
              <article className={`card greeting ${shown ? '' : 'greeting--off'}`} key={o.id}>
                <div className="greeting__card" dangerouslySetInnerHTML={{ __html: svg }} />
                <div className="greeting__text">
                  <label className="greeting__show">
                    <input type="checkbox" checked={shown} disabled={saving} onChange={(e) => toggle(o.id, e.target.checked)} />
                    Show on the website{shown ? '' : ' (switched off: no bar, no card on this day)'}
                  </label>
                  <p className="muted">
                    {label(date)} · {o.name}
                  </p>
                  <h3>{t.heading}</h3>
                  <p className="greeting__bar">
                    <b>Bar:</b> {t.bar}
                  </p>
                  <p>{t.about}</p>
                  <p dangerouslySetInnerHTML={{ __html: t.little }} />
                  <h4>Try this at home</h4>
                  <p>{turn(t.activities, year)}</p>
                  {!o.solemn && <p className="muted">Then: “Admissions are open for {admissionsYear(date)}” with a “Book a school visit” button (unless switched off in Site settings).</p>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
