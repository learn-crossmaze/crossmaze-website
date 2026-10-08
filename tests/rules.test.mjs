// Security rules tests. Run with the emulators:
//   npx firebase-tools emulators:exec --only firestore,storage --project demo-crossmaze "node --test tests/rules.test.mjs"
import { after, before, beforeEach, test } from 'node:test';
import fs from 'node:fs';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, getDocs, collection, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getBytes } from 'firebase/storage';

const [fsHost, fsPort] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080').split(':');
const [stHost, stPort] = (process.env.FIREBASE_STORAGE_EMULATOR_HOST ?? '127.0.0.1:9199').split(':');

let env;
const ADMIN = 'admin@crossmaze.test';

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-crossmaze-rules',
    firestore: { rules: fs.readFileSync('firestore.rules', 'utf8'), host: fsHost, port: Number(fsPort) },
    storage: { rules: fs.readFileSync('storage.rules', 'utf8'), host: stHost, port: Number(stPort) },
  });
});
after(() => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, `admins/${ADMIN}`), { email: ADMIN });
    await setDoc(doc(db, 'admins/other@crossmaze.test'), { email: 'other@crossmaze.test' });
    await setDoc(doc(db, 'content/site'), { name: 'Crossmaze' });
    await setDoc(doc(db, 'submissions/s1'), { type: 'admission_enquiry', data: { phone: '1' } });
    await setDoc(doc(db, 'private/litmus'), { url: 'https://x', headerValue: 'secret' });
    await setDoc(doc(db, 'meta/publish'), { status: 'live' });
  });
});

const admin = () => env.authenticatedContext('admin-uid', { email: ADMIN, email_verified: true });
const adminUnverified = () => env.authenticatedContext('admin-uid2', { email: ADMIN, email_verified: false });
const stranger = () => env.authenticatedContext('stranger', { email: 'parent@example.test', email_verified: true });
const anon = () => env.unauthenticatedContext();

test('visitors and strangers cannot read or change anything', async () => {
  for (const ctx of [anon(), stranger(), adminUnverified()]) {
    const db = ctx.firestore();
    await assertFails(getDoc(doc(db, 'content/site')));
    await assertFails(setDoc(doc(db, 'content/site'), { name: 'Hacked' }));
    await assertFails(getDoc(doc(db, 'submissions/s1')));
    await assertFails(getDoc(doc(db, 'private/litmus')));
    await assertFails(getDocs(collection(db, 'admins')));
    await assertFails(setDoc(doc(db, 'admins/parent@example.test'), { email: 'x' }));
  }
});

test('nobody can create submissions directly (only the submit function can)', async () => {
  for (const ctx of [anon(), stranger(), admin()]) {
    await assertFails(setDoc(doc(ctx.firestore(), 'submissions/new'), { type: 'admission_enquiry' }));
  }
});

test('admins can edit content, submissions and LITMUS settings', async () => {
  const db = admin().firestore();
  await assertSucceeds(setDoc(doc(db, 'content/site'), { name: 'Crossmaze' }));
  await assertSucceeds(setDoc(doc(db, 'branches/crossmaze-test'), { name: 'Test' }));
  await assertSucceeds(updateDoc(doc(db, 'submissions/s1'), { handled: true }));
  await assertSucceeds(getDoc(doc(db, 'private/litmus')));
  await assertSucceeds(setDoc(doc(db, 'meta/content'), { updatedBy: ADMIN }));
  await assertSucceeds(getDoc(doc(db, 'meta/publish')));
  await assertFails(setDoc(doc(db, 'meta/publish'), { status: 'live' }));
  await assertFails(getDoc(doc(db, 'ratelimits/x')));
});

test('people can check their own admin entry; only admins manage the list', async () => {
  await assertSucceeds(getDoc(doc(stranger().firestore(), 'admins/parent@example.test')));
  await assertFails(getDoc(doc(stranger().firestore(), `admins/${ADMIN}`)));
  const db = admin().firestore();
  await assertSucceeds(getDocs(collection(db, 'admins')));
  await assertSucceeds(setDoc(doc(db, 'admins/new@crossmaze.test'), { email: 'new@crossmaze.test' }));
  await assertSucceeds(deleteDoc(doc(db, 'admins/other@crossmaze.test')));
  await assertFails(deleteDoc(doc(db, `admins/${ADMIN}`)));
});

test('photos: public can view, only admins can upload images', async () => {
  const jpeg = new Uint8Array(5000);
  const path = 'site/uploads/branches/test.jpg';
  await assertSucceeds(uploadBytes(ref(admin().storage(), path), jpeg, { contentType: 'image/jpeg' }));
  await assertSucceeds(getBytes(ref(anon().storage(), path)));
  await assertFails(uploadBytes(ref(admin().storage(), 'site/uploads/branches/x.html'), jpeg, { contentType: 'text/html' }));
  await assertFails(uploadBytes(ref(stranger().storage(), 'site/uploads/branches/y.jpg'), jpeg, { contentType: 'image/jpeg' }));
  await assertFails(uploadBytes(ref(anon().storage(), 'site/uploads/branches/z.jpg'), jpeg, { contentType: 'image/jpeg' }));
  await assertFails(uploadBytes(ref(admin().storage(), 'other/place.jpg'), jpeg, { contentType: 'image/jpeg' }));
});
