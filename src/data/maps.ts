// A branch's map field (admin panel → Branches → "Google Maps location"): a Google Maps link pasted from the
// browser or the app's Share button, coordinates ("12.8187,77.6641"), or words to search for. Short share links
// (maps.app.goo.gl) are opened into the full link when the site is published (scripts/sync-content.mjs).

export interface MapLocation {
  /** The pin, when the field gives one. */
  coords?: { lat: number; lng: number };
  /** The admin's own Google Maps link, for "Get directions": it opens the place exactly as they chose it. */
  link?: string;
  /** Words to search for on Google Maps, when there is neither. */
  query?: string;
  /** The place's name in a link to a Google listing ("Crossmaze Preschool"), so the map shows its card. */
  name?: string;
}

const COORDS = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;

const valid = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : undefined;

/** Is this a Google Maps link (full or a short share link)? */
export const isMapsLink = (text: string) =>
  /^https?:\/\/(?:(?:www\.|maps\.)?google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(text.trim());

/** The pin in a Google Maps link: the place's own point (!3d…!4d…) first, then ?q=/query=/ll=, then the view (@lat,lng). */
export function coordsFromLink(link: string) {
  const pin = /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/.exec(link);
  if (pin) return valid(Number(pin[1]), Number(pin[2]));
  try {
    const url = new URL(link);
    for (const key of ['q', 'query', 'll', 'destination']) {
      const m = COORDS.exec(url.searchParams.get(key) ?? '');
      if (m) return valid(Number(m[1]), Number(m[2]));
    }
    const place = /\/place\/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)(?:[/?]|$)/.exec(decodeURIComponent(url.pathname));
    if (place) return valid(Number(place[1]), Number(place[2]));
  } catch {
    // Not a full address: fall through to the view.
  }
  const view = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(link);
  return view ? valid(Number(view[1]), Number(view[2])) : undefined;
}

/**
 * The link saved when a place is chosen from the admin panel's Google Maps search: Google's own "search" link,
 * which opens that listing (query_place_id), with its name and its pin (ll) for the page's map.
 */
export const placeLink = (p: { id: string; name: string; lat: number; lng: number }) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}&query_place_id=${encodeURIComponent(p.id)}&ll=${p.lat},${p.lng}`;

/** The listing's name in a /maps/place/<name>/ link; none when the "place" is only a dropped pin (degrees or numbers). */
function placeName(link: string) {
  try {
    const url = new URL(link);
    const query = url.searchParams.get('query');
    if (url.searchParams.get('query_place_id') && query && !COORDS.test(query)) return query.trim();
  } catch {
    // Not a full address.
  }
  const m = /\/maps\/place\/([^/@?]+)/.exec(link);
  if (!m) return undefined;
  let name: string;
  try {
    name = decodeURIComponent(m[1]!.replace(/\+/g, ' ')).trim();
  } catch {
    return undefined;
  }
  return name && !/\d\s*°|^-?\d+(?:\.\d+)?\s*,/.test(name) ? name : undefined;
}

export function mapLocation(field: string | undefined): MapLocation {
  const text = (field ?? '').trim();
  if (!text) return {};
  const m = COORDS.exec(text);
  if (m) return { coords: valid(Number(m[1]), Number(m[2])), query: text };
  if (isMapsLink(text)) return { coords: coordsFromLink(text), link: text, name: placeName(text) };
  return { query: text };
}

/** The map shown on the page: a named listing at its pin (with its name card), else the pin, else the search. */
export function mapEmbed(loc: MapLocation) {
  const at = loc.coords ? `${loc.coords.lat},${loc.coords.lng}` : undefined;
  if (loc.name && at) return `https://www.google.com/maps?q=${encodeURIComponent(loc.name)}&ll=${at}&z=17&output=embed`;
  const q = at ?? loc.query;
  return q ? `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=17&output=embed` : undefined;
}

/** "Get directions": the admin's own link when there is one, else a search for the pin or the words. */
export function mapDirections(loc: MapLocation) {
  if (loc.link) return loc.link;
  const q = loc.coords ? `${loc.coords.lat},${loc.coords.lng}` : (loc.query ?? loc.link);
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : undefined;
}
