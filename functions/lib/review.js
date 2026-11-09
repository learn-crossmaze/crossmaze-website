// Approving a blog draft from email. When a draft written in the repository reaches Firestore (the deploy
// adds it with `reviewRequested: true`, see scripts/sync-content.mjs), the full admins get an email with a
// secret link. The link opens a small page with the post's summary, its preview and a "Publish this post"
// button; only pressing the button (a POST) publishes, because email scanners open links by themselves.
// Each link works once, for REVIEW_DAYS days, and only for the draft exactly as it was emailed: any change to the
// post since (edited, published and hidden again, deleted and made again) ends it. Only a hash of its token is
// stored (reviews/{slug}), with the post's Firestore update time (postVersion).
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { SITE } from './litmus.js';

export const REVIEW_DAYS = 30;
export const REVIEW_PATH = '/api/blog-review';
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const TOKEN = /^[A-Za-z0-9_-]{43}$/;

const escape = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** A new secret for one review link (256 bits, URL-safe). */
export const newToken = () => randomBytes(32).toString('base64url');
export const hashToken = (token) => createHash('sha256').update(String(token)).digest('hex');

/** Whether a slug and token from a link are well formed (checked before anything is looked up). */
export const validLink = (slug, token) => typeof slug === 'string' && SLUG.test(slug) && typeof token === 'string' && TOKEN.test(token);

/** Compares a token with a stored hash in constant time. */
export function tokenMatches(token, storedHash) {
  if (typeof storedHash !== 'string' || !/^[0-9a-f]{64}$/.test(storedHash)) return false;
  return timingSafeEqual(Buffer.from(hashToken(token), 'hex'), Buffer.from(storedHash, 'hex'));
}

export const reviewUrl = (slug, token) => `https://${SITE}${REVIEW_PATH}?post=${encodeURIComponent(slug)}&t=${encodeURIComponent(token)}`;
export const previewUrl = (previewKey) => `https://${SITE}/blog/preview/${encodeURIComponent(previewKey)}`;
const adminUrl = `https://${SITE}/admin#/posts`;

/** A Firestore Timestamp (or anything with toMillis, or a number) as milliseconds, else NaN. */
const millis = (t) => (typeof t?.toMillis === 'function' ? t.toMillis() : typeof t === 'number' ? t : NaN);
/** A snapshot's update time as a string that survives being stored (seconds and nanoseconds). */
export const versionOf = (time) => (time && Number.isFinite(time.seconds) ? `${time.seconds}.${String(time.nanoseconds ?? 0).padStart(9, '0')}` : '');

/**
 * Where a review link stands, from its stored record (reviews/{slug}), the post and the post's version (its
 * snapshot's update time, versionOf).
 * @returns {'ok' | 'invalid' | 'expired' | 'used' | 'live' | 'gone' | 'changed'}
 */
export function linkState(review, post, token, version, now = Date.now()) {
  if (!review || !tokenMatches(token, review.tokenHash)) return 'invalid';
  if (!post) return 'gone';
  if (review.status === 'approved') return 'used';
  if (post.hidden !== true) return 'live';
  if (!review.postVersion || review.postVersion !== version) return 'changed';
  const expires = millis(review.expiresAt);
  if (!Number.isFinite(expires) || now > expires) return 'expired';
  return 'ok';
}

/**
 * The email the full admins get for a new draft.
 * @param {{ slug: string, title: string, summary?: string, previewKey?: string }} post
 * @param {string} token
 */
export function reviewEmail(post, token) {
  const link = reviewUrl(post.slug, token);
  const preview = post.previewKey ? previewUrl(post.previewKey) : '';
  const subject = `New blog draft to review: ${post.title}`;
  const intro = 'A new blog post is ready for you to review. It is a hidden draft: nobody else can see it until it is published.';
  const after = `Publishing makes it visible on the website's blog within a few minutes. To change it first, edit it in the admin panel (Blog) and publish from there (this link then stops working). It works once and for ${REVIEW_DAYS} days.`;
  const text = [
    intro,
    '',
    post.title,
    post.summary ?? '',
    '',
    `Review and publish: ${link}`,
    ...(preview ? [`Preview (ready a few minutes after this email): ${preview}`] : []),
    `Edit in the admin panel: ${adminUrl}`,
    '',
    after,
  ].join('\n');
  const html = `<p>${escape(intro)}</p>
<h2 style="margin:16px 0 4px;font-size:20px">${escape(post.title)}</h2>
<p style="margin:0 0 16px;color:#555">${escape(post.summary)}</p>
<p><a href="${escape(link)}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#1d2b6b;color:#ffffff;text-decoration:none;font-weight:bold">Review and publish</a></p>
${preview ? `<p><a href="${escape(preview)}">See the preview</a> (ready a few minutes after this email)</p>` : ''}
<p><a href="${escape(adminUrl)}">Edit it in the admin panel</a></p>
<p style="color:#555;font-size:13px">${escape(after)}</p>`;
  return { subject, html, text, noTracking: true };
}

const MESSAGES = {
  invalid: ['This link doesn’t work', 'The link is incomplete or wrong. Please use the button in the email, or publish the post from the admin panel (Blog).'],
  expired: ['This link has expired', `Review links work for ${REVIEW_DAYS} days. The post is still a hidden draft: publish it from the admin panel (Blog).`],
  used: ['Already published', 'This post was published with this link. The website shows it a few minutes after publishing.'],
  live: ['Already on the website', 'This post is no longer a hidden draft, so there is nothing to approve.'],
  gone: ['Post not found', 'This post has been deleted from the admin panel.'],
  changed: ['This draft has changed', 'The post was changed in the admin panel after this email was sent, so this link no longer publishes it. Check it in the admin panel (Blog) and publish it from there.'],
  busy: ['Please try again later', 'Too many attempts from this connection. Please wait a while, or publish the post from the admin panel (Blog).'],
  failed: ['Published, but the website didn’t update', 'The post is no longer hidden, but the website could not be rebuilt just now. Press Publish in the admin panel to update the website.'],
};

const page = (title, body) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>${escape(title)} · Crossmaze</title>
<style>
  :root { color-scheme: light dark; --ink:#1d2b6b; --muted:#5b6172; --card:#ffffff; --bg:#fdf6ee; --edge:#e8e1d8; --btn:#1d2b6b; --btn-ink:#ffffff; }
  @media (prefers-color-scheme: dark) { :root { --ink:#e8ebff; --muted:#aab0c4; --card:#1c2033; --bg:#11131f; --edge:#2c3150; --btn:#9fb0ff; --btn-ink:#11131f; } }
  body { margin:0; padding:24px 16px; background:var(--bg); color:var(--ink); font:16px/1.55 system-ui, -apple-system, 'Segoe UI', sans-serif; }
  main { max-width:560px; margin:0 auto; background:var(--card); border:1px solid var(--edge); border-radius:20px; padding:28px; }
  h1 { font-size:24px; line-height:1.25; margin:0 0 8px; } p { margin:0 0 14px; } .muted { color:var(--muted); font-size:14px; }
  button { font:inherit; font-weight:700; padding:12px 22px; border-radius:999px; border:0; background:var(--btn); color:var(--btn-ink); cursor:pointer; }
  a { color:inherit; }
</style></head><body><main>${body}</main></body></html>`;

/** The page a review link opens: the post and the button that publishes it. */
export function confirmPage(post, slug, token) {
  const preview = post.previewKey ? previewUrl(post.previewKey) : '';
  return page(
    `Publish “${post.title}”?`,
    `<p class="muted">New blog draft</p>
<h1>${escape(post.title)}</h1>
<p>${escape(post.summary)}</p>
${preview ? `<p><a href="${escape(preview)}" target="_blank" rel="noopener noreferrer">Read the full preview</a></p>` : ''}
<form method="post" action="${REVIEW_PATH}">
<input type="hidden" name="post" value="${escape(slug)}"><input type="hidden" name="t" value="${escape(token)}">
<button type="submit">Publish this post</button>
</form>
<p class="muted" style="margin-top:16px">Publishing makes it visible on the blog within a few minutes. To change it first, edit it in the admin panel (Blog) instead.</p>`,
  );
}

/** The page after publishing. */
export function donePage(post) {
  return page(
    'Published',
    `<h1>Published</h1>
<p>“${escape(post.title)}” is no longer a draft. The website is updating and shows it on the blog in a few minutes.</p>
<p class="muted">To change or hide it again, use the admin panel (Blog).</p>`,
  );
}

/** A page explaining why nothing was done. */
export function messagePage(state) {
  const [title, text] = MESSAGES[state] ?? MESSAGES.invalid;
  return page(title, `<h1>${escape(title)}</h1><p>${escape(text)}</p>`);
}
