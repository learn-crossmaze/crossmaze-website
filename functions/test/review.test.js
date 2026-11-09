import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  REVIEW_DAYS,
  confirmPage,
  donePage,
  hashToken,
  linkState,
  messagePage,
  newToken,
  reviewEmail,
  reviewUrl,
  tokenMatches,
  validLink,
} from '../lib/review.js';

const token = newToken();
const review = (extra = {}) => ({ tokenHash: hashToken(token), status: 'emailed', expiresAt: { toMillis: () => Date.now() + 1000 }, ...extra });
const draft = { title: 'Calm <bedtimes>', summary: 'Sleep & "routines"', previewKey: '0123456789abcdef', hidden: true };

test('review links carry a long random secret, stored only as a hash', () => {
  assert.match(token, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(newToken(), token);
  assert.equal(tokenMatches(token, hashToken(token)), true);
  assert.equal(tokenMatches(newToken(), hashToken(token)), false);
  assert.equal(tokenMatches(token, undefined), false);
  assert.equal(tokenMatches(token, 'not-a-hash'), false);
  assert.equal(reviewUrl('calm-bedtimes', token), `https://www.crossmaze.in/api/blog-review?post=calm-bedtimes&t=${token}`);
});

test('malformed links are refused before anything is looked up', () => {
  assert.equal(validLink('calm-bedtimes', token), true);
  assert.equal(validLink('../admins/x', token), false);
  assert.equal(validLink('Calm', token), false);
  assert.equal(validLink('calm-bedtimes', 'short'), false);
  assert.equal(validLink('calm-bedtimes', ['a']), false);
  assert.equal(validLink(undefined, token), false);
});

test('a link publishes only a hidden draft, once, before it expires', () => {
  assert.equal(linkState(review(), draft, token), 'ok');
  assert.equal(linkState(undefined, draft, token), 'invalid');
  assert.equal(linkState(review(), draft, newToken()), 'invalid');
  assert.equal(linkState(review(), undefined, token), 'gone');
  assert.equal(linkState(review({ status: 'approved' }), draft, token), 'used');
  assert.equal(linkState(review(), { ...draft, hidden: false }, token), 'live');
  assert.equal(linkState(review({ expiresAt: { toMillis: () => Date.now() - 1 } }), draft, token), 'expired');
  assert.equal(linkState(review({ expiresAt: undefined }), draft, token), 'expired');
  // A wrong secret never learns anything about the post.
  assert.equal(linkState(review({ status: 'approved' }), undefined, newToken()), 'invalid');
});

test('the email links to the review page and the preview, with the text escaped', () => {
  const email = reviewEmail({ slug: 'calm-bedtimes', ...draft }, token);
  assert.equal(email.subject, 'New blog draft to review: Calm <bedtimes>');
  assert.ok(email.text.includes(reviewUrl('calm-bedtimes', token)));
  assert.ok(email.text.includes('https://www.crossmaze.in/blog/preview/0123456789abcdef'));
  assert.ok(email.text.includes(`${REVIEW_DAYS} days`));
  assert.ok(email.html.includes('Calm &lt;bedtimes&gt;'));
  assert.ok(email.html.includes('Sleep &amp; &quot;routines&quot;'));
  assert.ok(!email.html.includes('<bedtimes>'));
  assert.ok(email.html.includes(`t=${token}`));
});

test('the review page publishes only with a POST of the same link', () => {
  const html = confirmPage(draft, 'calm-bedtimes', token);
  assert.match(html, /<form method="post" action="\/api\/blog-review">/);
  assert.ok(html.includes(`name="t" value="${token}"`));
  assert.ok(html.includes('name="post" value="calm-bedtimes"'));
  assert.ok(html.includes('Calm &lt;bedtimes&gt;'));
  assert.ok(html.includes('rel="noopener noreferrer"'));
  assert.ok(donePage(draft).includes('Calm &lt;bedtimes&gt;'));
  for (const state of ['invalid', 'expired', 'used', 'live', 'gone', 'busy', 'failed', 'unknown']) {
    assert.match(messagePage(state), /<h1>[^<]+<\/h1>/);
  }
});
