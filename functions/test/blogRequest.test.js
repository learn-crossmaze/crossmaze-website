import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { CONCEPT_MAX, DAILY_LIMIT, REQUEST_ID, WRITING_MS, cleanConcept, fireText, mayRequest, startProblem, startWriting } from '../lib/blogRequest.js';

test('the concept is tidied and must be a sensible length', () => {
  assert.deepEqual(cleanConcept('  Toilet training tips\r\nfor parents of toddlers.  \n\n\n\nFive tips.\u0007 '), {
    ok: true,
    concept: 'Toilet training tips\nfor parents of toddlers.\n\nFive tips.',
  });
  assert.equal(cleanConcept('too short').ok, false);
  assert.equal(cleanConcept('x'.repeat(CONCEPT_MAX + 1)).ok, false);
  assert.equal(cleanConcept('x'.repeat(CONCEPT_MAX)).ok, true);
  assert.equal(cleanConcept(undefined).ok, false);
  assert.equal(cleanConcept({ concept: 'An object, not text, of some length' }).ok, false);
  // Characters that don't show (tag characters, direction overrides, zero-width spaces) are dropped, so pasted
  // text can't carry words the admin never saw; the joiners Indian scripts need stay.
  const hidden = 'A post about sharing toys\u200b\u202e\u2066\ufeff\u{e0041}\u{e0042}\u0085 for toddlers';
  assert.equal(cleanConcept(hidden).concept, 'A post about sharing toys for toddlers');
  assert.equal(cleanConcept('ಕನ್ನಡ ರಾಜ್‌ಯೋತ್ಸವ ಕ್‍ಷ: a post for Rajyotsava').concept, 'ಕನ್ನಡ ರಾಜ್‌ಯೋತ್ಸವ ಕ್‍ಷ: a post for Rajyotsava');
});

test('one draft at a time, and a daily limit for the school', () => {
  const now = Date.now();
  assert.deepEqual(mayRequest([], now), { ok: true });
  // Being written just now: wait.
  assert.equal(mayRequest([{ status: 'writing', at: now - 60000 }], now).ok, false);
  // A run that never reported back stops blocking.
  assert.equal(mayRequest([{ status: 'writing', at: now - WRITING_MS - 1 }], now).ok, true);
  const ready = Array.from({ length: DAILY_LIMIT }, (_, i) => ({ status: 'ready', at: now - (i + 1) * 3600000 }));
  assert.equal(mayRequest(ready, now).ok, false);
  assert.equal(mayRequest(ready.slice(1), now).ok, true);
  // Requests that never started don't use up the day.
  assert.equal(mayRequest([...ready.slice(1), { status: 'failed', at: now - 1000 }, { status: 'failed', at: now - 2000 }], now).ok, true);
});

test('the writer is sent the request id and the words', () => {
  const text = fireText('AbCdEfGhIjKlMnOpQrSt', 'A post about sharing.');
  assert.match(text, /^Blog draft request AbCdEfGhIjKlMnOpQrSt\n/);
  assert.ok(text.endsWith('A post about sharing.'));
  assert.ok(REQUEST_ID.test('AbCdEfGhIjKlMnOpQrSt'));
  assert.equal(REQUEST_ID.test('../admins/x'), false);
});

function fakeWriter(status, answer) {
  const received = [];
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      received.push({ headers: req.headers, body: JSON.parse(body) });
      res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(answer));
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, received, url: `http://127.0.0.1:${server.address().port}/v1/claude_code/routines/trig_x/fire` })));
}

test('starts the writing task with its token and reports the session', async () => {
  const writer = await fakeWriter(200, { type: 'routine_fire', claude_code_session_id: 'session_1', claude_code_session_url: 'https://claude.ai/code/session_1' });
  try {
    assert.deepEqual(await startWriting({ url: writer.url, token: ' secret ' }, 'hello'), { ok: true, sessionUrl: 'https://claude.ai/code/session_1' });
    const [{ headers, body }] = writer.received;
    assert.equal(headers.authorization, 'Bearer secret');
    assert.equal(headers['anthropic-beta'], 'experimental-cc-routine-2026-04-01');
    assert.equal(headers['anthropic-version'], '2023-06-01');
    assert.deepEqual(body, { text: 'hello' });
  } finally {
    writer.server.close();
  }
});

test('a session link from anywhere else is not kept', async () => {
  const writer = await fakeWriter(200, { claude_code_session_url: 'https://evil.example/session' });
  try {
    assert.deepEqual(await startWriting({ url: writer.url, token: 't' }, 'hello'), { ok: true, sessionUrl: '' });
  } finally {
    writer.server.close();
  }
});

test('reports why the writing task could not be started', async () => {
  assert.deepEqual(await startWriting({ url: '', token: 't' }, 'x'), { ok: false, error: 'not_configured', started: 'no' });
  assert.deepEqual(await startWriting({ url: 'https://api.anthropic.com/v1/claude_code/routines/trig_01Ab/fire', token: '' }, 'x'), { ok: false, error: 'not_configured', started: 'no' });
  // The token never goes anywhere but Anthropic's trigger address.
  let called = false;
  const spy = async () => ((called = true), new Response('{}'));
  for (const url of ['https://evil.example/v1/claude_code/routines/trig_01Ab/fire', 'https://api.anthropic.com.evil.example/v1/claude_code/routines/trig_01Ab/fire', 'https://api.anthropic.com/v1/messages', 'http://api.anthropic.com/v1/claude_code/routines/trig_01Ab/fire']) {
    assert.deepEqual(await startWriting({ url, token: 't' }, 'x', spy), { ok: false, error: 'bad_address', started: 'no' });
  }
  assert.equal(called, false);
  const ok = await startWriting({ url: 'https://api.anthropic.com/v1/claude_code/routines/trig_01Ab/fire', token: 't' }, 'x', async () => new Response('{}', { status: 200 }));
  assert.deepEqual(ok, { ok: true, sessionUrl: '' });
  const refused = await fakeWriter(401, { error: 'no' });
  try {
    assert.deepEqual(await startWriting({ url: refused.url, token: 't' }, 'x'), { ok: false, error: 'http_401', started: 'no' });
  } finally {
    refused.server.close();
  }
  // Never connected: it certainly didn't start.
  const closed = await fakeWriter(200, {});
  await new Promise((resolve) => closed.server.close(resolve));
  assert.deepEqual(await startWriting({ url: closed.url, token: 't' }, 'x'), { ok: false, error: 'network', started: 'no' });
  // A broken answer after the request was sent, a server error or a slow answer: it may have started.
  const broken = await fakeWriter(503, { error: 'busy' });
  try {
    assert.deepEqual(await startWriting({ url: broken.url, token: 't' }, 'x'), { ok: false, error: 'http_503', started: 'maybe' });
  } finally {
    broken.server.close();
  }
  const reset = async () => {
    throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNRESET' } });
  };
  assert.deepEqual(await startWriting({ url: 'http://127.0.0.1:9/fire', token: 't' }, 'x', reset), { ok: false, error: 'network', started: 'maybe' });
  const slow = async () => {
    throw Object.assign(new Error('timed out'), { name: 'TimeoutError' });
  };
  assert.deepEqual(await startWriting({ url: 'http://127.0.0.1:9/fire', token: 't' }, 'x', slow), { ok: false, error: 'timeout', started: 'maybe' });
  assert.match(startProblem('timeout', 'maybe'), /may be on its way/);
  // A redirect is refused, so the token is never sent on.
  let options;
  await startWriting({ url: 'http://127.0.0.1:9/fire', token: 't' }, 'x', async (_url, init) => ((options = init), new Response('{}')));
  assert.equal(options.redirect, 'error');
  assert.match(startProblem('not_configured'), /not set up/);
  assert.match(startProblem('http_401'), /token/);
  assert.match(startProblem('http_429'), /hour/);
  assert.match(startProblem('network'), /try again/);
});
