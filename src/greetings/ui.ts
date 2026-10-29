// The greeting's pop-up and the share/download buttons (components/Greetings.astro has the bar and styles).
// Loaded only on the days there is a greeting, or on the preview page (/greetings).
import { admissionsYear } from './calendar';
import { CARD_FONTS, type Measure, renderCard, turn } from './card';
import { occasionById } from './occasions';
import { paletteFor } from './palettes';
import { textFor } from './text';
import type { Occasion } from './types';

export interface GreetingData {
  settings: { admissions: boolean };
  /** The school's blog posts about each occasion, newest first. */
  stories: Record<string, { url: string; title: string; date: string }[]>;
}

const LOGO = '/logo.png';
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
const theme = () => document.documentElement.dataset.theme;

let measure: Measure | undefined;
/** Measures text in the card's fonts, once they have loaded. */
async function cardMeasure(): Promise<Measure> {
  if (measure) return measure;
  await Promise.all([
    document.fonts.load(`700 40px '${CARD_FONTS.display}'`),
    document.fonts.load(`700 40px '${CARD_FONTS.text}'`),
    document.fonts.load(`800 40px '${CARD_FONTS.text}'`),
  ]).catch(() => undefined);
  const ctx = document.createElement('canvas').getContext('2d');
  measure = ctx ? (text, font) => ((ctx.font = font), ctx.measureText(text).width) : undefined;
  return measure ?? ((text) => text.length * 18);
}

/** The card as SVG markup, for the page. */
export async function cardSvg(o: Occasion, year: number, defs = '', logo = LOGO) {
  return renderCard({ occasion: o, text: textFor(o.id, o.name), year, palette: paletteFor(theme(), o.solemn), logo, measure: await cardMeasure(), defs });
}

const dataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
const fetchDataUrl = async (url: string) => dataUrl(await (await fetch(url)).blob());

/** The card as a 1080 × 1080 PNG file. An SVG drawn as a picture loads nothing itself, so the fonts and logo go inside it. */
async function cardPng(o: Occasion, year: number) {
  const [display, text, logo] = await Promise.all([
    fetchDataUrl('/greetings/card-display.woff2'),
    fetchDataUrl('/greetings/card-text.woff2'),
    fetchDataUrl(LOGO),
  ]);
  const defs = `<style>@font-face{font-family:'${CARD_FONTS.display}';src:url(${display}) format('woff2');font-weight:300 700}@font-face{font-family:'${CARD_FONTS.text}';src:url(${text}) format('woff2');font-weight:200 1000}</style>`;
  const svg = await cardSvg(o, year, defs, logo);
  const img = new Image();
  img.src = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  await img.decode();
  // Fonts inside an SVG picture can finish loading a moment after it decodes.
  await new Promise((r) => setTimeout(r, 150));
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1080;
  canvas.getContext('2d')?.drawImage(img, 0, 0, 1080, 1080);
  URL.revokeObjectURL(img.src);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not make the picture');
  return new File([blob], `crossmaze-${o.id}-${year}.png`, { type: 'image/png' });
}

async function share(o: Occasion, year: number, button: HTMLButtonElement) {
  const t = textFor(o.id, o.name);
  const message = `${t.title(year)} from all of us at Crossmaze! ${location.origin}`;
  button.disabled = true;
  try {
    const file = await cardPng(o, year);
    // Phones: the share sheet, with WhatsApp in it, sends the picture itself.
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text: message });
      return;
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') return; // the visitor closed the share sheet
  } finally {
    button.disabled = false;
  }
  // Computers: WhatsApp with the words and a link (the card can be downloaded and attached).
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
}

async function download(o: Occasion, year: number, button: HTMLButtonElement) {
  button.disabled = true;
  try {
    const file = await cardPng(o, year);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  } finally {
    button.disabled = false;
  }
}

/** The pop-up's words for one occasion. */
function textHtml(o: Occasion, year: number, today: string, data: GreetingData) {
  const t = textFor(o.id, o.name);
  // A post from the school about this occasion from the last 14 months (festival dates move by weeks).
  const since = new Date(Date.parse(`${today}T00:00:00Z`) - 430 * 86400000).toISOString().slice(0, 10);
  const story = (data.stories[o.id] ?? []).find((s) => s.date < today && s.date >= since);
  const admissions = data.settings.admissions && !o.solemn;
  return `<p class="eyebrow">${esc(t.eyebrow)}</p>
<h2 id="greet-title">${esc(t.heading)}</h2>
<p>${esc(t.about)}</p>
<p>${t.little}</p>
<h3>Try this at home</h3>
<div class="greet-dialog__try"><p>${esc(turn(t.activities, year))}</p></div>
${story ? `<a class="greet-dialog__story" href="${esc(story.url)}">See how our little ones celebrated last year →</a>` : ''}
${admissions ? `<div class="greet-dialog__admissions tone-sun"><b>Admissions are open for <span style="white-space:nowrap">${admissionsYear(today)} 🎉</span></b><a class="btn btn--sun" href="/contact#enquire">Book a school visit</a></div>` : ''}`;
}

let dialog: HTMLDialogElement | undefined;

/** Opens the pop-up for one or more occasions (tabs switch between them). */
export async function openGreeting(ids: string[], year: number, today: string, data: GreetingData) {
  const list = ids.map(occasionById).filter((o): o is Occasion => !!o);
  if (!list.length) return;
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.className = 'greet-dialog';
    dialog.setAttribute('aria-labelledby', 'greet-title');
    // A tap on the dimmed page outside the pop-up closes it.
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog?.close();
    });
    document.body.append(dialog);
  }
  const d = dialog;
  const show = async (o: Occasion) => {
    d.innerHTML = `<div class="greet-dialog__body">
<button type="button" class="greet-dialog__close" aria-label="Close">×</button>
<div class="greet-dialog__card">${await cardSvg(o, year)}
<div class="greet-dialog__share"><button type="button" class="btn btn--sm greet-wa">${innerWidth < 640 ? 'WhatsApp' : 'Share on WhatsApp'}</button><button type="button" class="btn btn--sm btn--ghost greet-dl">Download</button></div></div>
<div class="greet-dialog__text">
${list.length > 1 ? `<div class="greet-dialog__tabs" role="group" aria-label="Today's greetings">${list.map((x) => `<button type="button" class="btn btn--sm ${x.id === o.id ? '' : 'btn--ghost'}" aria-pressed="${x.id === o.id}" data-id="${x.id}">${esc(x.name)}</button>`).join('')}</div>` : ''}
${textHtml(o, year, today, data)}
</div></div>`;
    d.querySelector('.greet-dialog__close')?.addEventListener('click', () => d.close());
    const wa = d.querySelector<HTMLButtonElement>('.greet-wa');
    const dl = d.querySelector<HTMLButtonElement>('.greet-dl');
    wa?.addEventListener('click', () => share(o, year, wa));
    dl?.addEventListener('click', () => download(o, year, dl));
    d.querySelectorAll<HTMLButtonElement>('.greet-dialog__tabs button').forEach((b) =>
      b.addEventListener('click', () => {
        const next = list.find((x) => x.id === b.dataset.id);
        if (next) show(next).then(() => d.querySelector<HTMLButtonElement>(`.greet-dialog__tabs [data-id="${next.id}"]`)?.focus());
      }),
    );
  };
  await show(list[0]);
  if (!d.open) d.showModal();
}

/** Fills in the bar once the page has loaded: the card as its picture, and the line of words. */
export async function setUpBar(bar: HTMLElement, data: GreetingData) {
  const ids = (bar.dataset.ids ?? '').split(',').filter(Boolean);
  const year = Number(bar.dataset.year);
  const today = bar.dataset.today ?? '';
  const first = occasionById(ids[0]);
  if (!first) return;
  const line = bar.querySelector('.greet-bar__line');
  if (line) line.textContent = textFor(first.id, first.name).bar;
  const thumb = bar.querySelector('.greet-bar__thumb');
  if (thumb) {
    const img = new Image();
    img.alt = '';
    img.src = URL.createObjectURL(new Blob([await cardSvg(first, year)], { type: 'image/svg+xml' }));
    thumb.replaceChildren(img);
  }
  const open = bar.querySelector<HTMLButtonElement>('.greet-bar__open');
  if (open && first.solemn && ids.length === 1) open.textContent = 'Read more';
  open?.addEventListener('click', () => openGreeting(ids, year, today, data));
  bar.querySelector('.greet-bar__close')?.addEventListener('click', () => {
    bar.hidden = true;
    try {
      localStorage.setItem('cm-greet-closed', today);
    } catch {
      // Private browsing: it simply shows again on the next page.
    }
  });
}
