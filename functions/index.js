// Cloud Functions for www.crossmaze.in
//
//   submit             POST /api/submit (Hosting rewrite). Saves a website form submission
//                      in Firestore, then forwards it to LITMUS.
//   resendSubmissions  Admin panel: send selected (or all unsent) submissions to LITMUS again.
//   testLitmus         Admin panel: send a test payload with the saved LITMUS settings.
//   publishSite        Admin panel "Publish": starts the GitHub Actions deploy, which pulls the
//                      latest content from Firestore and rebuilds the site.
//   retryLitmus        Every 30 minutes, retries submissions that failed to reach LITMUS.
import { createHash } from 'node:crypto';
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onCall, onRequest, HttpsError } from 'firebase-functions/https';
import { onSchedule } from 'firebase-functions/scheduler';
import { setGlobalOptions } from 'firebase-functions/options';
import { defineSecret, defineString } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import { assertAdmin } from './lib/admin.js';
import { isSpam, validateSubmission } from './lib/forms.js';
import { buildPayload, sendToLitmus } from './lib/litmus.js';

initializeApp();
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

// Keep in sync with the "region" of the /api/submit rewrite in firebase.json and src/admin/firebase.ts.
setGlobalOptions({ region: 'asia-south1', maxInstances: 10 });

const githubToken = defineSecret('GITHUB_DISPATCH_TOKEN');
const githubRepo = defineString('GITHUB_REPO', { default: 'learn-crossmaze/crossmaze-website' });
const githubWorkflow = defineString('GITHUB_WORKFLOW', { default: 'firebase-hosting.yml' });
const githubRef = defineString('GITHUB_REF', { default: 'main' });

const RATE_LIMIT = { max: 8, windowMs: 60 * 60 * 1000 };
const MAX_LITMUS_ATTEMPTS = 6;

const litmusConfig = async () => (await db.doc('private/litmus').get()).data();

/**
 * Sends one stored submission to LITMUS and records the outcome on the document.
 * @param {FirebaseFirestore.DocumentSnapshot} snap
 * @param {Awaited<ReturnType<typeof litmusConfig>>} config
 */
async function forward(snap, config) {
  const doc = snap.data();
  if (!doc) return 'missing';
  const payload = buildPayload(snap.id, {
    type: doc.type,
    data: doc.data,
    page: doc.page,
    createdAt: doc.createdAt?.toDate?.(),
  });
  const result = await sendToLitmus(config, payload);
  await snap.ref.update({
    'litmus.status': result.status,
    'litmus.lastAttemptAt': FieldValue.serverTimestamp(),
    'litmus.attempts': result.status === 'not_configured' ? FieldValue.increment(0) : FieldValue.increment(1),
    'litmus.httpStatus': result.httpStatus ?? FieldValue.delete(),
    'litmus.lastError': result.error ?? FieldValue.delete(),
    ...(result.status === 'sent' ? { 'litmus.sentAt': FieldValue.serverTimestamp() } : {}),
  });
  if (result.status === 'failed') logger.warn('LITMUS delivery failed', { id: snap.id, error: result.error });
  return result.status;
}

/** Allows at most RATE_LIMIT.max submissions per IP address per hour. */
async function withinRateLimit(ip) {
  const key = createHash('sha256').update(`crossmaze:${ip}`).digest('hex').slice(0, 32);
  const ref = db.doc(`ratelimits/${key}`);
  return db.runTransaction(async (tx) => {
    const now = Date.now();
    const current = (await tx.get(ref)).data();
    const fresh = !current || now - current.windowStart > RATE_LIMIT.windowMs;
    const count = fresh ? 1 : current.count + 1;
    tx.set(ref, {
      windowStart: fresh ? now : current.windowStart,
      count,
      expireAt: new Date(now + 2 * RATE_LIMIT.windowMs),
    });
    return count <= RATE_LIMIT.max;
  });
}

export const submit = onRequest({ cors: true, memory: '256MiB', timeoutSeconds: 30 }, async (req, res) => {
  if (req.method !== 'POST') {
    res.set('Allow', 'POST').status(405).json({ ok: false, error: 'Use POST' });
    return;
  }
  const body = typeof req.body === 'string' ? safeJson(req.body) : req.body;
  if (isSpam(body)) {
    res.json({ ok: true });
    return;
  }
  const result = validateSubmission(body);
  if (!result.ok) {
    res.status(400).json({ ok: false, errors: result.errors });
    return;
  }
  if (!(await withinRateLimit(req.ip ?? 'unknown'))) {
    res.status(429).json({ ok: false, error: 'Too many submissions. Please call us instead.' });
    return;
  }

  const ref = await db.collection('submissions').add({
    type: result.type,
    data: result.data,
    page: result.page,
    userAgent: String(req.get('user-agent') ?? '').slice(0, 300),
    createdAt: FieldValue.serverTimestamp(),
    handled: false,
    litmus: { status: 'pending', attempts: 0 },
  });

  try {
    await forward(await ref.get(), await litmusConfig());
  } catch (err) {
    // The submission is saved; the scheduled retry or the admin panel can resend it.
    logger.error('Forwarding to LITMUS crashed', { id: ref.id, err });
  }
  res.json({ ok: true, id: ref.id });
});

export const resendSubmissions = onCall({ timeoutSeconds: 300 }, async (request) => {
  await assertAdmin(db, request);
  const ids = Array.isArray(request.data?.ids) ? request.data.ids.filter((id) => typeof id === 'string').slice(0, 100) : [];
  let snaps;
  if (ids.length) {
    snaps = await Promise.all(ids.map((id) => db.doc(`submissions/${id}`).get()));
  } else {
    const query = await db
      .collection('submissions')
      .where('litmus.status', 'in', ['pending', 'failed', 'not_configured'])
      .limit(100)
      .get();
    snaps = query.docs;
  }
  const config = await litmusConfig();
  const counts = { sent: 0, failed: 0, not_configured: 0, missing: 0 };
  for (const snap of snaps) counts[await forward(snap, config)] += 1;
  return counts;
});

export const testLitmus = onCall(async (request) => {
  const email = await assertAdmin(db, request);
  const config = await litmusConfig();
  if (!config?.url) throw new HttpsError('failed-precondition', 'Save a LITMUS URL first.');
  const payload = buildPayload(`test-${Date.now()}`, {
    type: 'test',
    data: { message: `Test from the Crossmaze admin panel by ${email}` },
    page: '/admin',
  });
  return sendToLitmus({ ...config, enabled: true }, payload);
});

export const publishSite = onCall({ secrets: [githubToken] }, async (request) => {
  const email = await assertAdmin(db, request);
  const repo = githubRepo.value();
  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows/${githubWorkflow.value()}/dispatches`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${githubToken.value()}`,
        'User-Agent': 'Crossmaze-Admin',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ ref: githubRef.value() }),
    },
  );
  if (res.status !== 204) {
    const detail = (await res.text().catch(() => '')).slice(0, 300);
    logger.error('GitHub dispatch failed', { status: res.status, detail });
    throw new HttpsError(
      'failed-precondition',
      res.status === 401 || res.status === 403 || res.status === 404
        ? 'GitHub refused the publish request. Check the GITHUB_DISPATCH_TOKEN secret (see README).'
        : `GitHub answered HTTP ${res.status}.`,
    );
  }
  const actionsUrl = `https://github.com/${repo}/actions/workflows/${githubWorkflow.value()}`;
  await db.doc('meta/publish').set(
    { status: 'building', requestedAt: FieldValue.serverTimestamp(), requestedBy: email, actionsUrl },
    { merge: true },
  );
  return { ok: true, actionsUrl };
});

export const retryLitmus = onSchedule({ schedule: 'every 30 minutes', timeoutSeconds: 300 }, async () => {
  const config = await litmusConfig();
  if (!config?.enabled || !config.url) return;
  const failed = await db.collection('submissions').where('litmus.status', '==', 'failed').limit(50).get();
  for (const snap of failed.docs) {
    if ((snap.get('litmus.attempts') ?? 0) < MAX_LITMUS_ATTEMPTS) await forward(snap, config);
  }
});

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
