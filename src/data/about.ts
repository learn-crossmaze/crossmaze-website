// The "About us" paragraphs (content/site.json `about`), each with an optional subheading. Each is stored as
// text, the subheading on its first line with a colon and a blank line after it, so every version of the site
// and the admin panel reads the same list; the admin edits the subheading and paragraph in separate boxes.

export interface AboutParagraph {
  heading: string;
  text: string;
}

const blankLine = /\r?\n[ \t]*\r?\n/;

/** Longest subheading the admin accepts; the reader allows a little more for the colon. */
export const aboutHeadingMax = 120;

export function aboutParagraph(raw: unknown): AboutParagraph {
  if (raw && typeof raw === 'object') {
    const { heading, text } = raw as Record<string, unknown>;
    return { heading: typeof heading === 'string' ? heading.trim() : '', text: typeof text === 'string' ? text.trim() : '' };
  }
  const value = typeof raw === 'string' ? raw.trim() : '';
  const [first = '', ...rest] = value.split(blankLine);
  const body = rest.join('\n\n').trim();
  const line = first.trim();
  // A short first line on its own, not a sentence, is the subheading (without its colon).
  if (body && !/\n/.test(line) && line.length <= aboutHeadingMax + 10 && !/[.!?]$/.test(line))
    return { heading: line.replace(/\s*[:：]$/, ''), text: body };
  return { heading: '', text: value };
}

/** How an About paragraph is stored: what `aboutParagraph` reads back. */
export function aboutText(paragraph: Partial<AboutParagraph>): string {
  const heading = (paragraph.heading ?? '').trim().replace(/\s*[:：]$/, '');
  const text = (paragraph.text ?? '').trim();
  return heading ? `${heading}:\n\n${text}` : text;
}

/** Why a paragraph wouldn't be read back as it was written, if it wouldn't. */
export function aboutProblem(paragraph: Partial<AboutParagraph>): string | undefined {
  if ((paragraph.heading ?? '').trim().length > aboutHeadingMax) return `Subheading must be ${aboutHeadingMax} characters or fewer`;
  if (!(paragraph.heading ?? '').trim() && aboutParagraph(paragraph.text ?? '').heading)
    return 'Its first line would show as a subheading: move it to Subheading, or end it with a full stop';
  return undefined;
}

export const aboutParagraphs = (raw: unknown): AboutParagraph[] =>
  (Array.isArray(raw) ? raw : []).map(aboutParagraph).filter((p) => p.heading || p.text);

/** A paragraph's text split where the editor left a blank line. */
export const blocksOf = (text: string) =>
  text
    .split(blankLine)
    .map((t) => t.trim())
    .filter(Boolean);
