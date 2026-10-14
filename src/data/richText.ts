// The light formatting allowed in blog text written in the admin panel:
//
//   A blank line starts a new paragraph.
//   Lines starting with "- " (or "* ") make a bullet list; "1. " makes a numbered list.
//   **bold**, _italic_ and [link text](https://… or /page) inside a line.
//
// Everything else is shown as plain text: HTML typed into the admin panel is escaped, and links may
// only point to web pages, email, phone numbers or pages on this site.

export type Block = { type: 'p'; html: string } | { type: 'ul' | 'ol'; items: string[] };

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const SAFE_LINK = /^(https?:\/\/|mailto:|tel:|\/|#)/i;

/** Formats one line (already split into paragraphs or list items) as safe HTML. */
export function inline(text: string): string {
  return escape(text)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, label: string, href: string) => {
      const url = href.replace(/&amp;/g, '&');
      if (!SAFE_LINK.test(url)) return label;
      const external = /^https?:\/\//i.test(url) && !/^https?:\/\/(www\.)?crossmaze\.in/i.test(url);
      return `<a href="${escape(url)}"${external ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
    })
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])_(.+?)_(?=[\s).,!?;:]|$)/g, '$1<em>$2</em>');
}

const BULLET = /^\s*[-*•]\s+/;
const NUMBER = /^\s*\d+[.)]\s+/;

/** Splits text from the admin panel into paragraphs and lists. */
export function blocks(text: string | undefined): Block[] {
  const out: Block[] = [];
  for (const chunk of (text ?? '').replace(/\r\n?/g, '\n').split(/\n\s*\n/)) {
    const lines = chunk.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim());
    if (!lines.length) continue;
    let para: string[] = [];
    const flush = () => {
      if (para.length) out.push({ type: 'p', html: para.map((l) => inline(l.trim())).join('<br />') });
      para = [];
    };
    for (const line of lines) {
      const kind = BULLET.test(line) ? 'ul' : NUMBER.test(line) ? 'ol' : null;
      if (!kind) {
        para.push(line);
        continue;
      }
      flush();
      const item = inline(line.replace(kind === 'ul' ? BULLET : NUMBER, ''));
      const last = out[out.length - 1];
      if (last && last.type === kind) last.items.push(item);
      else out.push({ type: kind, items: [item] });
    }
    flush();
  }
  return out;
}

/** Plain words in some formatted text, for reading time and search snippets. */
export const plain = (text: string | undefined) =>
  (text ?? '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_#>`-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
