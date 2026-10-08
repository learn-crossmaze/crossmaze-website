#!/usr/bin/env node
// Records the outcome of a deploy in Firestore (meta/publish) so the admin panel can show it.
// Usage: node scripts/report-publish.mjs <success|failure|cancelled>
import { FieldValue } from 'firebase-admin/firestore';
import { connect, hasCredentials } from './firebase.mjs';

const outcome = process.argv[2] ?? 'success';
if (!hasCredentials()) process.exit(0);

const { db } = connect();
const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID, GITHUB_SHA } = process.env;
await db.doc('meta/publish').set(
  {
    status: outcome === 'success' ? 'live' : 'failed',
    finishedAt: FieldValue.serverTimestamp(),
    commit: GITHUB_SHA ?? null,
    runUrl: GITHUB_RUN_ID ? `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}` : null,
  },
  { merge: true },
);
console.log(`Reported publish ${outcome}.`);
