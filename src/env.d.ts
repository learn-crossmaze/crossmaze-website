interface ImportMetaEnv {
  readonly PUBLIC_FORM_ENDPOINT?: string;
  readonly PUBLIC_FIREBASE_API_KEY?: string;
  readonly PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
  readonly PUBLIC_FIREBASE_PROJECT_ID?: string;
  readonly PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
  readonly PUBLIC_FIREBASE_APP_ID?: string;
  readonly PUBLIC_FIREBASE_EMULATORS?: string;
  readonly PUBLIC_ADMIN_GOOGLE_SIGNIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
