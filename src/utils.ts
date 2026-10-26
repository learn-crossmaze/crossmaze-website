/** Turns a built page path (/branch.html, /index.html) into its public URL path (/branch, /). */
export const cleanPath = (pathname: string) => pathname.replace(/(\/index)?\.html$/, '').replace(/\/$/, '') || '/';

/**
 * JSON for an inline <script> (structured data, page data): "<" is written as \u003c, so text from the admin
 * panel (a blog post title, say) can never close the script tag early. JSON reads it back the same.
 */
export const jsonScript = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');

/** A breadcrumb trail as a page shows it: Home first, then each step, the page itself last (no link). */
export type Crumb = { label: string; href?: string };

/** The same trail for search engines (schema.org BreadcrumbList; Google shows it in place of the address). */
export const breadcrumbList = (trail: Crumb[], base: string) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: trail.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.label,
    ...(c.href ? { item: new URL(c.href, base).href } : {}),
  })),
});

/** "A", "A and B", "A, B and C". */
export const listText = (items: string[]) =>
  items.length < 2 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
