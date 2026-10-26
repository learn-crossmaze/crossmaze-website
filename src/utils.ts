/** Turns a built page path (/branch.html, /index.html) into its public URL path (/branch, /). */
export const cleanPath = (pathname: string) => pathname.replace(/(\/index)?\.html$/, '').replace(/\/$/, '') || '/';

/**
 * JSON for an inline <script> (structured data, page data): "<" is written as \u003c, so text from the admin
 * panel (a blog post title, say) can never close the script tag early. JSON reads it back the same.
 */
export const jsonScript = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
