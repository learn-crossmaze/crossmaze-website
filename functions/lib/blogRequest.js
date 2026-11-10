// "Request a draft" (admin panel → Blog): a full admin types what a blog post should be about, and the school's
// Claude scheduled task writes it (the same task that writes a post every two weeks; its saved prompt holds the
// writing rules). requestDraft in index.js records the request (blogRequests/{id}) and starts the task through
// its API trigger with the text below. The task adds the post as a hidden draft through a pull request; the deploy
// that adds it to Firestore marks the request ready (scripts/sync-content.mjs) and the admins get the review email
// (lib/review.js).

export const CONCEPT_MIN = 20;
export const CONCEPT_MAX = 1500;
/** Requests a day, for the whole school. */
export const DAILY_LIMIT = 5;
/** One draft is written at a time; a run that never reported back stops blocking after this long. */
export const WRITING_MS = 90 * 60 * 1000;
export const REQUEST_ID = /^[A-Za-z0-9]{16,32}$/;

const FIRE_BETA = 'experimental-cc-routine-2026-04-01';
const FIRE_URL = /^https:\/\/api\.anthropic\.com\/v1\/claude_code\/routines\/trig_[A-Za-z0-9]+\/fire$/;

/**
 * The admin's text, tidied: line endings and runs of blank lines normalised, control characters removed.
 * @returns {{ ok: true, concept: string } | { ok: false, error: string }}
 */
export function cleanConcept(value) {
  if (typeof value !== 'string') return { ok: false, error: 'Write what the post should be about.' };
  const concept = value
    .replace(/\r\n?/g, '\n')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (concept.length < CONCEPT_MIN) return { ok: false, error: `Tell us a little more: at least ${CONCEPT_MIN} characters.` };
  if (concept.length > CONCEPT_MAX) return { ok: false, error: `That is too long: keep it under ${CONCEPT_MAX} characters.` };
  return { ok: true, concept };
}

/**
 * Whether a new request may start, from the requests of the last day ({ status, at } with `at` in milliseconds).
 * Requests that never started (failed) don't count.
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function mayRequest(recent, now = Date.now()) {
  const counted = recent.filter((r) => r.status !== 'failed');
  if (counted.some((r) => r.status === 'writing' && now - r.at < WRITING_MS)) {
    return { ok: false, error: 'A draft is being written just now. You can ask for the next one when it arrives (about an hour).' };
  }
  if (counted.length >= DAILY_LIMIT) {
    return { ok: false, error: `The school can ask for ${DAILY_LIMIT} drafts a day. Please try again tomorrow.` };
  }
  return { ok: true };
}

/** What the writing task is sent: the request's id (it comes back with the post) and the admin's words. */
export const fireText = (id, concept) => `Blog draft request ${id}\n\nWhat the school's admin asked for:\n${concept}`;

/**
 * Starts the writing task through its API trigger.
 * @param {{ url?: string, token?: string }} config the trigger's address and its token
 * @returns {Promise<{ ok: true, sessionUrl: string } | { ok: false, error: string }>}
 */
export async function startWriting(config, text, fetchImpl = fetch) {
  const url = (config.url ?? '').trim();
  const token = (config.token ?? '').trim();
  if (!url || !token) return { ok: false, error: 'not_configured' };
  // The token is only ever sent to Anthropic's trigger address (or a local one in tests).
  const local = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(url);
  if (!FIRE_URL.test(url) && !local) return { ok: false, error: 'bad_address' };
  try {
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'anthropic-beta': FIRE_BETA,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return { ok: false, error: `http_${res.status}` };
    const answer = await res.json().catch(() => ({}));
    const sessionUrl = typeof answer.claude_code_session_url === 'string' && answer.claude_code_session_url.startsWith('https://claude.ai/') ? answer.claude_code_session_url : '';
    return { ok: true, sessionUrl };
  } catch (err) {
    return { ok: false, error: err?.name === 'TimeoutError' ? 'timeout' : 'network' };
  }
}

/** What to tell the admin when the task couldn't be started. */
export function startProblem(error) {
  if (error === 'not_configured' || error === 'bad_address') return 'Draft requests are not set up yet (see “Ask for a draft” in the README).';
  if (error === 'http_401' || error === 'http_403' || error === 'http_404') return 'Claude refused the request. The task’s API token may have been changed (see “Ask for a draft” in the README).';
  if (error === 'http_429') return 'Too many requests just now. Please try again in an hour.';
  return 'The writer could not be reached. Please try again in a few minutes.';
}
