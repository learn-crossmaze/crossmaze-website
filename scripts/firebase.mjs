// Shared Firebase Admin setup for the build scripts.
//
// Credentials, in order of preference:
//   FIREBASE_SERVICE_ACCOUNT        the service-account JSON itself (GitHub Actions secret)
//   GOOGLE_APPLICATION_CREDENTIALS  path to a service-account JSON file
// Project:  FIREBASE_PROJECT_ID, else the default project in .firebaserc
// Bucket:   FIREBASE_STORAGE_BUCKET, else <project>.firebasestorage.app
// Emulators are used automatically when FIRESTORE_EMULATOR_HOST / FIREBASE_STORAGE_EMULATOR_HOST are set.
import fs from 'node:fs';
import { cert, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

export function projectId() {
  if (process.env.FIREBASE_PROJECT_ID) return process.env.FIREBASE_PROJECT_ID;
  const rc = JSON.parse(fs.readFileSync(new URL('../.firebaserc', import.meta.url), 'utf8'));
  return rc.projects.default;
}

export function hasCredentials() {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.FIRESTORE_EMULATOR_HOST,
  );
}

export function connect() {
  const project = projectId();
  const credential = process.env.FIREBASE_SERVICE_ACCOUNT
    ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    : process.env.FIRESTORE_EMULATOR_HOST
      ? undefined
      : applicationDefault();
  const app = initializeApp({
    projectId: project,
    ...(credential ? { credential } : {}),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${project}.firebasestorage.app`,
  });
  const db = getFirestore(app);
  db.settings({ ignoreUndefinedProperties: true });
  return { db, bucket: getStorage(app).bucket() };
}
