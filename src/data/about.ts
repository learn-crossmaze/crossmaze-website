// The "About us" paragraphs (content/site.json `about`), each with an optional subheading. Each is stored as
// text, the subheading on its first line with a colon and a blank line after it, so every version of the site
// and the admin panel reads the same list; the admin edits the subheading and paragraph in separate boxes.

export interface AboutParagraph {
  heading: string;
  text: string;
}

/** A line with nothing on it but spaces (including non-breaking and zero-width ones). */
const blankLine = /\r?\n(?:[^\S\r\n]|[​﻿])*\r?\n/;
/** Ends like a sentence: a full stop, question or exclamation mark or ellipsis, maybe inside quotes or brackets. */
const sentenceEnd = /[.!?…]["'’”)\]]*$/;

/** Longest subheading the admin accepts, and the longest first line read as one. */
export const aboutHeadingMax = 120;

const cleanHeading = (heading: string | undefined) => (heading ?? '').trim().replace(/\s*[:：]$/, '');

export function aboutParagraph(raw: unknown): AboutParagraph {
  if (raw && typeof raw === 'object') {
    const { heading, text } = raw as Record<string, unknown>;
    return { heading: typeof heading === 'string' ? heading.trim() : '', text: typeof text === 'string' ? text.trim() : '' };
  }
  const value = typeof raw === 'string' ? raw.trim() : '';
  const [first = '', ...rest] = value.split(blankLine);
  const body = rest.join('\n\n').trim();
  const line = first.trim();
  const heading = cleanHeading(line);
  // A short first line on its own, not a sentence, is the subheading (without its colon).
  if (body && heading && !/\n/.test(line) && heading.length <= aboutHeadingMax && !sentenceEnd.test(line)) return { heading, text: body };
  return { heading: '', text: value };
}

/** How an About paragraph is stored: what `aboutParagraph` reads back. */
export function aboutText(paragraph: Partial<AboutParagraph>): string {
  const heading = cleanHeading(paragraph.heading);
  const text = (paragraph.text ?? '').trim();
  return heading ? `${heading}:\n\n${text}` : text;
}

/** Why a paragraph wouldn't be read back as it was written, if it wouldn't. */
export function aboutProblem(paragraph: Partial<AboutParagraph>): string | undefined {
  const heading = cleanHeading(paragraph.heading);
  if (heading.length > aboutHeadingMax) return `Subheading must be ${aboutHeadingMax} characters or fewer`;
  if (!heading && aboutParagraph(paragraph.text ?? '').heading)
    return 'Its first line would show as a subheading: move it to Subheading, or remove the blank line after it';
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
