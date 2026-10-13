// Taps on the website's call and WhatsApp buttons, sent by src/scripts/call-log.ts.
// A website can't see who called or whether the call went through: it only knows that someone
// tapped to call. Each tap records which centre, the page and the spot on it, the kind of device
// and how the visit started, with nothing that identifies the visitor (the visit id is a random
// code the browser forgets when the tab closes).

const CHANNELS = ['phone', 'whatsapp'];
const DEVICES = ['Phone', 'Tablet', 'Computer'];

/** One line of plain text, at most `max` characters. */
const text = (value, max) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '');

/**
 * Checks a tap sent by the website.
 * @param {unknown} body parsed request body
 * @returns {{ ok: true, call: { channel: string, number: string, branch: string, page: string, place: string, source: string, visit: string, device: string } } | { ok: false }}
 */
export function validateCall(body) {
  if (!body || typeof body !== 'object') return { ok: false };
  const input = /** @type {Record<string, unknown>} */ (body);
  if (input.event !== 'contact') return { ok: false };
  const channel = CHANNELS.includes(/** @type {string} */ (input.channel)) ? String(input.channel) : '';
  const number = typeof input.number === 'string' ? input.number.replace(/\D/g, '') : '';
  if (!channel || number.length < 6 || number.length > 15) return { ok: false };
  const page = typeof input.page === 'string' && input.page.startsWith('/') ? input.page.slice(0, 200) : '';
  const visit = typeof input.visit === 'string' && /^[a-z0-9]{6,32}$/i.test(input.visit) ? input.visit : '';
  const device = DEVICES.includes(/** @type {string} */ (input.device)) ? String(input.device) : '';
  return {
    ok: true,
    call: {
      channel,
      number,
      branch: text(input.branch, 80),
      page,
      place: text(input.place, 120),
      source: text(input.source, 120),
      visit,
      device,
    },
  };
}

/** A rough device type from the browser's user agent, for taps that didn't say. */
export function deviceOf(userAgent) {
  const ua = String(userAgent ?? '');
  if (!ua) return '';
  if (/iPad|Tablet|PlayBook|Silk|Android(?!.*Mobile)/i.test(ua)) return 'Tablet';
  if (/Mobi|iPhone|iPod|Android|BlackBerry|Opera Mini|IEMobile/i.test(ua)) return 'Phone';
  return 'Computer';
}
