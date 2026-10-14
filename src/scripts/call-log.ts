// Records taps on the website's call and WhatsApp buttons, for the Calls page in the admin panel.
//
// A website can't see who called or whether the call went through: tapping a call button hands the
// number to the phone's dialler. So each tap records what the website does know: which centre's
// number, the page and the spot on it, the kind of device and how the visit started (a search, a
// social link, an ad). Nothing identifies the visitor; the visit id is a random code the browser
// forgets when the tab closes, so several taps in one visit count as one person.
//
// Taps go to the submit function (functions/index.js, body.event "contact"). Preview links
// (crossmaze-website--pr…) don't send any, so checking a preview doesn't add to the real log.

const endpoint = import.meta.env.PUBLIC_FORM_ENDPOINT || '/api/submit';

/** Last 10 digits of each number on the site → the centre it belongs to (see BaseLayout.astro). */
const numbers: Record<string, string> = (() => {
  try {
    return JSON.parse(document.getElementById('cm-call-numbers')?.textContent || '{}');
  } catch {
    return {};
  }
})();

/** Remembered for the whole visit, so a tap on a later page still knows how the visit started. */
const visit = (() => {
  const KEY = 'cm-visit';
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (saved?.id) return saved as { id: string; source: string };
  } catch {
    // Storage blocked: every page counts as a new visit.
  }
  const params = new URLSearchParams(location.search);
  const campaign = ['utm_source', 'utm_medium', 'utm_campaign']
    .map((key) => params.get(key))
    .filter(Boolean)
    .join(' / ');
  let referrer = '';
  try {
    const from = new URL(document.referrer);
    if (from.host !== location.host) referrer = from.hostname.replace(/^www\./, '');
  } catch {
    // No referrer: typed in, a bookmark, or an app that hides it.
  }
  const source = campaign || (params.has('gclid') ? 'Google Ads' : '') || referrer || 'Direct';
  const value = { id: Math.random().toString(36).slice(2, 12), source };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Not remembered; the tap is still recorded.
  }
  return value;
})();

const device = () => {
  if (!matchMedia('(pointer: coarse)').matches) return 'Computer';
  return Math.min(screen.width, screen.height) >= 600 ? 'Tablet' : 'Phone';
};

/** Where on the page the button is, in words the school will recognise. */
function placeOf(link: Element) {
  if (link.closest('.site-header')) return 'Menu bar';
  if (link.closest('.site-footer')) return 'Footer';
  if (link.closest('.whatsapp-fab')) return 'WhatsApp button';
  if (link.closest('.branch-card')) return 'Branch card';
  if (link.closest('.hero, .page-hero')) return 'Top of the page';
  const heading = link.closest('section')?.querySelector('h1, h2');
  return heading?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function send(data: Record<string, string>) {
  if (location.hostname.includes('--')) return;
  const body = JSON.stringify({ event: 'contact', ...data });
  try {
    // Sent as text/plain, which needs no permission check and survives the dialler opening.
    if (navigator.sendBeacon?.(endpoint, body)) return;
  } catch {
    // Fall through to fetch.
  }
  fetch(endpoint, { method: 'POST', body, keepalive: true }).catch(() => {});
}

// Where the "Call a centre" pop-up was opened from, so a call made from it says so.
let pickerFrom = '';

// On window, so it runs after the pop-up's own handler: a click that only opens the pop-up has
// been cancelled by then and isn't counted as a call.
window.addEventListener('click', (event) => {
  const link = (event.target as Element | null)?.closest?.('a[href]');
  if (!(link instanceof HTMLAnchorElement)) return;
  if (link.matches('[data-call-picker]')) pickerFrom = placeOf(link);
  if (event.defaultPrevented) return;

  const href = link.getAttribute('href') ?? '';
  const channel = href.startsWith('tel:') ? 'phone' : /^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href) ? 'whatsapp' : '';
  if (!channel) return;
  const number = href.replace(/\?.*$/, '').replace(/\D/g, '');
  // A "share on WhatsApp" link (wa.me/?text=…) has no number: it isn't someone contacting a centre.
  if (!number) return;
  const inPicker = Boolean(link.closest('.call-picker'));

  send({
    channel,
    number,
    branch: numbers[number.slice(-10)] ?? '',
    page: location.pathname,
    place: inPicker ? `“Call a centre” pop-up${pickerFrom ? ` (opened from ${pickerFrom})` : ''}` : placeOf(link),
    source: visit.source,
    visit: visit.id,
    device: device(),
  });
});
