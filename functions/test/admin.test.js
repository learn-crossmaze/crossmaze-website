import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertAdmin } from '../lib/admin.js';

/** A stand-in for Firestore that knows which admin entries exist. */
const fakeDb = (paths) => ({ doc: (path) => ({ get: async () => ({ exists: paths.includes(path) }) }) });
const db = fakeDb(['admins/head@crossmaze.test', 'branchAdmins/neotown@crossmaze.test']);
const caller = (email, verified = true) => ({ auth: { token: { email, email_verified: verified } } });

test('lets admins in and returns their lower-case email', async () => {
  assert.equal(await assertAdmin(db, caller('Head@Crossmaze.test')), 'head@crossmaze.test');
  assert.equal(await assertAdmin(db, caller('head@crossmaze.test'), { branchAdmins: true }), 'head@crossmaze.test');
});

test('lets branch admins in only where they are allowed', async () => {
  await assert.rejects(assertAdmin(db, caller('neotown@crossmaze.test')), { code: 'permission-denied' });
  assert.equal(await assertAdmin(db, caller('neotown@crossmaze.test'), { branchAdmins: true }), 'neotown@crossmaze.test');
});

test('turns away strangers, unverified emails and signed-out callers', async () => {
  await assert.rejects(assertAdmin(db, caller('parent@example.test'), { branchAdmins: true }), { code: 'permission-denied' });
  await assert.rejects(assertAdmin(db, caller('neotown@crossmaze.test', false), { branchAdmins: true }), { code: 'permission-denied' });
  await assert.rejects(assertAdmin(db, {}, { branchAdmins: true }), { code: 'unauthenticated' });
});
