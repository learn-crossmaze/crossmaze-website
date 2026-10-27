// Cloud Functions for www.crossmaze.in
//
//   submit             POST /api/submit (Hosting rewrite). Saves a website form submission
//                      in Firestore (and an attached resume in Cloud Storage) and answers the
//                      visitor straight away. Also records taps on the website's call and WhatsApp
//                      buttons (body.event "contact") for the admin panel's Calls page.
//   forwardSubmission  When a submission is saved, sends it to LITMUS. If LITMUS can't take it, the
//                      full admins get an email with its details (ZeptoMail, private/zeptomail).
//   resendSubmissions  Admin panel: send selected (or all unsent) submissions to LITMUS again.
//   testLitmus         Admin panel: send a test payload with the saved LITMUS settings.
//   testEmailAlert     Admin panel: send a test alert email to the admin who asks.
//   publishSite        Admin panel "Publish" (admins and branch admins): starts the GitHub Actions
//                      deploy, which pulls the latest content from Firestore and rebuilds the site.
//   retryLitmus        Every 30 minutes, retries submissions that failed to reach LITMUS (and any
//                      that were never tried).
import { createHash, randomUUID } from 'node:crypto';
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { onDocumentCreated } from 'firebase-functions/firestore';
import { onCall, onRequest, HttpsError } from 'firebase-functions/https';
import { onSchedule } from 'firebase-functions/scheduler';
import { setGlobalOptions } from 'firebase-functions/options';
import { defineSecret, defineString } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import { assertAdmin } from './lib/admin.js';
import { litmusFailureEmail, testEmail } from './lib/alerts.js';
import { deviceOf, validateCall } from './lib/calls.js';
import { isSpam, validateSubmission } from './lib/forms.js';
import { buildPayload, sendToLitmus } from './lib/litmus.js';
import { sendEmail } from './lib/zeptomail.js';

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
const CALL_RATE_LIMIT = { max: 30, windowMs: 60 * 60 * 1000 };
const MAX_LITMUS_ATTEMPTS = 6;
// Nobody waits for the background sends (forwardSubmission, retryLitmus), so a slow LITMUS gets longer.
const BACKGROUND_LITMUS_TIMEOUT_MS = 20 * 1000;
// A submission still "pending" after this long was never tried (its forwardSubmission didn't run).
const PENDING_GRACE_MS = 10 * 60 * 1000;

const litmusConfig = async () => (await db.doc('private/litmus').get()).data();
const emailConfig = async () => (await db.doc('private/zeptomail').get()).data();

/**
 * Sends one stored submission to LITMUS and records the outcome on the document.
 * @param {FirebaseFirestore.DocumentSnapshot} snap
 * @param {Awaited<ReturnType<typeof litmusConfig>>} config
 * @param {number} [timeoutMs] how long to wait for LITMUS
 */
async function forward(snap, config, timeoutMs) {
  const doc = snap.data();
  if (!doc) return 'missing';
  const payload = buildPayload(snap.id, {
    type: doc.type,
    data: doc.data,
    page: doc.page,
    createdAt: doc.createdAt?.toDate?.(),
  });
  const result = await sendToLitmus(config, payload, fetch, timeoutMs);
  await snap.ref.update({
    'litmus.status': result.status,
    'litmus.lastAttemptAt': FieldValue.serverTimestamp(),
    'litmus.attempts': result.status === 'not_configured' ? FieldValue.increment(0) : FieldValue.increment(1),
    'litmus.httpStatus': result.httpStatus ?? FieldValue.delete(),
    'litmus.lastError': result.error ?? FieldValue.delete(),
    ...(result.status === 'sent' ? { 'litmus.sentAt': FieldValue.serverTimestamp() } : {}),
  });
  if (result.status === 'failed') {
    logger.warn('LITMUS delivery failed', { id: snap.id, error: result.error });
    // A problem with the email never stops the forwarding (or the retry of the next submission).
    await alertAdmins(snap, result.error).catch((err) => logger.error('Alert email crashed', { id: snap.id, err }));
  }
  return result.status;
}

/**
 * Emails the full admins that a submission couldn't be sent to LITMUS, with its details, once per
 * submission (again on a later failure only if that email didn't go out).
 * @param {FirebaseFirestore.DocumentSnapshot} snap
 * @param {string | undefined} error
 */
async function alertAdmins(snap, error) {
  // Claimed first, so retries running at the same time don't send it twice (a claim left "sending"
  // by a crash is taken over after PENDING_GRACE_MS).
  const claimed = await db.runTransaction(async (tx) => {
    const current = await tx.get(snap.ref);
    const status = current.get('alert.status');
    const stuck = status === 'sending' && Date.now() - (current.get('alert.at')?.toMillis?.() ?? 0) > PENDING_GRACE_MS;
    if (status && status !== 'failed' && !stuck) return false;
    tx.update(snap.ref, { 'alert.status': 'sending', 'alert.at': FieldValue.serverTimestamp() });
    return true;
  });
  if (!claimed) return;
  const [config, admins] = await Promise.all([emailConfig(), db.collection('admins').get()]);
  const doc = snap.data() ?? {};
  const message = litmusFailureEmail({ id: snap.id, type: doc.type, data: doc.data, page: doc.page, error });
  const result = await sendEmail(config, { to: admins.docs.map((admin) => admin.id), ...message });
  await snap.ref.update({
    'alert.status': result.status,
    'alert.at': FieldValue.serverTimestamp(),
    'alert.error': result.error ?? FieldValue.delete(),
  });
  if (result.status === 'failed') logger.error('Alert email failed', { id: snap.id, error: result.error });
}

/**
 * Allows at most `limit.max` requests per IP address per window.
 * @param {string} ip the visitor's IP address, prefixed with a scope for limits other than forms
 */
async function withinRateLimit(ip, limit = RATE_LIMIT) {
  const key = createHash('sha256').update(`crossmaze:${ip}`).digest('hex').slice(0, 32);
  const ref = db.doc(`ratelimits/${key}`);
  return db.runTransaction(async (tx) => {
    const now = Date.now();
    const current = (await tx.get(ref)).data();
    const fresh = !current || now - current.windowStart > limit.windowMs;
    const count = fresh ? 1 : current.count + 1;
    tx.set(ref, {
      windowStart: fresh ? now : current.windowStart,
      count,
      expireAt: new Date(now + 2 * limit.windowMs),
    });
    return count <= limit.max;
  });
}

export const submit = onRequest({ cors: true, memory: '256MiB', timeoutSeconds: 30 }, async (req, res) => {
  if (req.method !== 'POST') {
    res.set('Allow', 'POST').status(405).json({ ok: false, error: 'Use POST' });
    return;
  }
  const body = typeof req.body === 'string' ? safeJson(req.body) : req.body;
  if (body?.event === 'contact') {
    await logCall(req, res, body);
    return;
  }
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

  const ref = db.collection('submissions').doc();
  let files;
  try {
    files = await storeFiles(ref.id, result.files, result.data);
  } catch (err) {
    // The website then offers to send the application by email instead.
    logger.error('Saving an uploaded file failed', { id: ref.id, err });
    res.status(500).json({ ok: false, error: 'Could not save the file' });
    return;
  }
  await ref.set({
    type: result.type,
    data: result.data,
    page: result.page,
    files,
    userAgent: String(req.get('user-agent') ?? '').slice(0, 300),
    createdAt: FieldValue.serverTimestamp(),
    handled: false,
    litmus: { status: 'pending', attempts: 0 },
  });

  // Saved, so the visitor is thanked now; forwardSubmission sends it on to LITMUS.
  // `files` tells the website which uploads were saved (older versions of this function ignored them).
  res.json({ ok: true, id: ref.id, files: files.map((f) => f.field) });
});

export const forwardSubmission = onDocumentCreated({ document: 'submissions/{id}', timeoutSeconds: 60 }, async (event) => {
  if (!event.data) return;
  try {
    await forward(event.data, await litmusConfig(), BACKGROUND_LITMUS_TIMEOUT_MS);
  } catch (err) {
    // The submission stays "pending"; retryLitmus tries it again.
    logger.error('Forwarding to LITMUS crashed', { id: event.params.id, err });
  }
});

/**
 * Records a tap on a call or WhatsApp button (sent by src/scripts/call-log.ts with sendBeacon,
 * which ignores the answer).
 * @param {import('firebase-functions/https').Request} req
 * @param {import('express').Response} res
 * @param {unknown} body
 */
async function logCall(req, res, body) {
  const result = validateCall(body);
  if (!result.ok) {
    res.status(400).json({ ok: false });
    return;
  }
  if (!(await withinRateLimit(`calls:${req.ip ?? 'unknown'}`, CALL_RATE_LIMIT))) {
    res.status(429).json({ ok: false });
    return;
  }
  const { call } = result;
  await db.collection('calls').add({
    ...call,
    device: call.device || deviceOf(req.get('user-agent')),
    createdAt: FieldValue.serverTimestamp(),
  });
  res.status(204).end();
}

/**
 * Saves uploaded files under <folder>/<submission id>/ (readable only by admins and by whoever has
 * the link), and adds "<field>_link" and "<field>_file" to the submission data for LITMUS.
 * @param {string} id submission id
 * @param {Record<string, { name: string, contentType: string, buffer: Buffer, folder: string }>} uploads
 * @param {Record<string, string>} data
 */
async function storeFiles(id, uploads, data) {
  const files = [];
  for (const [field, upload] of Object.entries(uploads)) {
    const path = `${upload.folder}/${id}/${upload.name}`;
    const bucket = getStorage().bucket();
    const token = randomUUID();
    await bucket.file(path).save(upload.buffer, {
      resumable: false,
      contentType: upload.contentType,
      metadata: {
        contentDisposition: `inline; filename="${upload.name}"`,
        cacheControl: 'private, max-age=0',
        metadata: { firebaseStorageDownloadTokens: token, submissionId: id },
      },
    });
    // A Firebase download link: works with its secret token, without signing in.
    data[`${field}_link`] = `${storageOrigin()}/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
    data[`${field}_file`] = upload.name;
    files.push({ field, path, name: upload.name, contentType: upload.contentType, size: upload.buffer.length });
  }
  return files;
}

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

export const testEmailAlert = onCall(async (request) => {
  const email = await assertAdmin(db, request);
  const config = await emailConfig();
  if (!config?.token || !config.fromAddress) throw new HttpsError('failed-precondition', 'Save a ZeptoMail token and a From address first.');
  return sendEmail({ ...config, enabled: true }, { to: [email], ...testEmail(email) });
});

export const publishSite = onCall({ secrets: [githubToken] }, async (request) => {
  // Branch admins publish too, so their blog posts and centre head changes reach the website.
  const email = await assertAdmin(db, request, { branchAdmins: true });
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

export const retryLitmus = onSchedule({ schedule: 'every 30 minutes', timeoutSeconds: 900 }, async () => {
  const config = await litmusConfig();
  if (!config?.enabled || !config.url) return;
  const failed = await db.collection('submissions').where('litmus.status', '==', 'failed').limit(50).get();
  for (const snap of failed.docs) {
    if ((snap.get('litmus.attempts') ?? 0) < MAX_LITMUS_ATTEMPTS) await forward(snap, config, BACKGROUND_LITMUS_TIMEOUT_MS);
  }
  // Ones saved a while ago but never tried.
  const pending = await db.collection('submissions').where('litmus.status', '==', 'pending').limit(50).get();
  for (const snap of pending.docs) {
    const created = snap.get('createdAt')?.toMillis?.() ?? 0;
    if (Date.now() - created > PENDING_GRACE_MS) await forward(snap, config, BACKGROUND_LITMUS_TIMEOUT_MS);
  }
});

function storageOrigin() {
  const emulator = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
  return emulator ? `http://${emulator.replace(/^https?:\/\//, '')}` : 'https://firebasestorage.googleapis.com';
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
