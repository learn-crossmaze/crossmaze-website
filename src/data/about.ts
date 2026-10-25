// The "About us" paragraphs (content/site.json `about`), each with an optional subheading. They used to be
// stored as plain text, with any subheading typed as the first line and a blank line after it; the website
// and the admin panel read both shapes, and the admin saves the new one the next time the list is edited.

export interface AboutParagraph {
  heading: string;
  text: string;
}

const blankLine = /\r?\n[ \t]*\r?\n/;

export function aboutParagraph(raw: unknown): AboutParagraph {
  if (raw && typeof raw === 'object') {
    const { heading, text } = raw as Record<string, unknown>;
    return { heading: typeof heading === 'string' ? heading.trim() : '', text: typeof text === 'string' ? text.trim() : '' };
  }
  const value = typeof raw === 'string' ? raw.trim() : '';
  const [first = '', ...rest] = value.split(blankLine);
  const body = rest.join('\n\n').trim();
  const line = first.trim();
  // A short first line on its own, not a sentence, is the subheading (without the colon it was typed with).
  if (body && !/\n/.test(line) && line.length <= 120 && !/[.!?]$/.test(line)) return { heading: line.replace(/\s*[:：]$/, ''), text: body };
  return { heading: '', text: value };
}

export const aboutParagraphs = (raw: unknown): AboutParagraph[] =>
  (Array.isArray(raw) ? raw : []).map(aboutParagraph).filter((p) => p.heading || p.text);

/** A paragraph's text split where the editor left a blank line. */
export const blocksOf = (text: string) =>
  text
    .split(blankLine)
    .map((t) => t.trim())
    .filter(Boolean);
