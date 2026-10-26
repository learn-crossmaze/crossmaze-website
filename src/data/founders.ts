// The founders (content/site.json `founders`; admin: Site settings → About page), shown on the About page and
// to search engines only while `showFounders` is on. Each founder was once stored as just a name (text), and
// the database keeps those until someone edits them, so a text entry is read as a founder with only a name.

export interface Founder {
  name: string;
  /** E.g. "Co-founder"; nothing is shown when it is empty. */
  role: string;
  /** A path under src/assets/, like the other photos. */
  photo: string;
  photoAlt: string;
  /** A few lines about them; a blank line starts a new paragraph. */
  about: string;
}

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export function founder(raw: unknown): Founder {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const f = raw as Record<string, unknown>;
    return { name: text(f.name), role: text(f.role), photo: text(f.photo), photoAlt: text(f.photoAlt), about: text(f.about) };
  }
  return { name: text(raw), role: '', photo: '', photoAlt: '', about: '' };
}

/** The founders with a name, in order. */
export const founders = (raw: unknown): Founder[] => (Array.isArray(raw) ? raw : []).map(founder).filter((f) => f.name);

/** Their initials, for a founder without a photo ("Manushree Chaturvedi" → "MC"). */
export const initials = (name: string) =>
  name
    .replace(/^(?:Mrs?s?|Ms|Dr|Prof)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0]!.toUpperCase())
    .slice(0, 3)
    .join('');
