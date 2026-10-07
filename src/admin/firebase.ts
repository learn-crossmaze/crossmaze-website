// Firebase setup for the admin panel.
// On Firebase Hosting the web-app config comes from /__/firebase/init.json; for `npm run dev`
// set the PUBLIC_FIREBASE_* variables in .env (see .env.example).
import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, type Functions } from 'firebase/functions';
import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage';

// Keep in sync with setGlobalOptions({ region }) in functions/index.js.
export const FUNCTIONS_REGION = 'asia-south1';

export interface FirebaseServices {
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
  functions: Functions;
  projectId: string;
}

async function loadConfig(): Promise<FirebaseOptions> {
  const env = import.meta.env;
  if (env.PUBLIC_FIREBASE_API_KEY) {
    return {
      apiKey: env.PUBLIC_FIREBASE_API_KEY,
      authDomain: env.PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: env.PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: env.PUBLIC_FIREBASE_STORAGE_BUCKET,
      appId: env.PUBLIC_FIREBASE_APP_ID,
    };
  }
  const res = await fetch('/__/firebase/init.json');
  if (!res.ok) {
    throw new Error(
      'Firebase is not configured. Add a Web app in the Firebase console, or set the PUBLIC_FIREBASE_* variables for local development.',
    );
  }
  return res.json();
}

let services: Promise<FirebaseServices> | undefined;

export function firebase(): Promise<FirebaseServices> {
  services ??= (async () => {
    const config = await loadConfig();
    const app = initializeApp(config);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);
    const functions = getFunctions(app, FUNCTIONS_REGION);
    if (import.meta.env.PUBLIC_FIREBASE_EMULATORS === 'true') {
      const host = window.location.hostname;
      connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
      connectFirestoreEmulator(db, host, 8080);
      connectStorageEmulator(storage, host, 9199);
      connectFunctionsEmulator(functions, host, 5001);
    }
    return { auth, db, storage, functions, projectId: config.projectId ?? '' };
  })();
  return services;
}
