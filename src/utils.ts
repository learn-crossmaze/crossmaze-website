/** Turns a built page path (/branch.html, /index.html) into its public URL path (/branch, /). */
export const cleanPath = (pathname: string) => pathname.replace(/(\/index)?\.html$/, '').replace(/\/$/, '') || '/';
