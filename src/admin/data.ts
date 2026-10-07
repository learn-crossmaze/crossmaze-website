// Small React hooks around the Firebase SDK for the admin panel.
import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { firebase, type FirebaseServices } from './firebase';

export function useFirebase() {
  const [services, setServices] = useState<FirebaseServices>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    firebase().then(setServices, (e: Error) => setError(e.message));
  }, []);
  return { services, error };
}

export function useUser(services?: FirebaseServices) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => (services ? onAuthStateChanged(services.auth, setUser) : undefined), [services]);
  return user;
}

export function useDoc<T = DocumentData>(db: Firestore, path: string) {
  const [state, setState] = useState<{ data?: T; loading: boolean; error?: string }>({ loading: true });
  useEffect(
    () =>
      onSnapshot(
        doc(db, path),
        (snap) => setState({ data: snap.exists() ? (snap.data() as T) : undefined, loading: false }),
        (e) => setState({ loading: false, error: e.message }),
      ),
    [db, path],
  );
  return state;
}

export type WithId<T> = T & { id: string };

export function useCollection<T = DocumentData>(db: Firestore, name: string) {
  const [state, setState] = useState<{ items: WithId<T>[]; loading: boolean; error?: string }>({ items: [], loading: true });
  useEffect(
    () =>
      onSnapshot(
        collection(db, name),
        (snap) => {
          const items = snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
          items.sort((a, b) => (Number((a as { order?: number }).order) || 0) - (Number((b as { order?: number }).order) || 0));
          setState({ items, loading: false });
        },
        (e) => setState({ items: [], loading: false, error: e.message }),
      ),
    [db, name],
  );
  return state;
}

/** Records that content changed, so the dashboard can show "unpublished changes". */
export const markChanged = (db: Firestore, email: string | null) =>
  setDoc(doc(db, 'meta/content'), { updatedAt: serverTimestamp(), updatedBy: email ?? '' }, { merge: true });

/** Removes undefined values (Firestore rejects them) and trims trailing empty list items. */
export function clean<T>(value: T): T {
  if (Array.isArray(value)) return value.map(clean).filter((v) => v !== undefined) as T;
  if (value && typeof value === 'object' && !(value instanceof Date) && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, clean(v)]),
    ) as T;
  }
  return value;
}

// ------------------------------------------------------------------- images

const MAX_SIDE = 2400;

/** Shrinks big phone photos before upload; PNGs (logos) are left alone to keep transparency. */
async function prepare(file: File): Promise<Blob> {
  if (!/^image\/(jpeg|webp)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 2_000_000) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', 0.85));
  } catch {
    return file;
  }
}

export async function uploadImage(services: FirebaseServices, file: File, folder: string): Promise<string> {
  const blob = await prepare(file);
  const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : blob.type === 'image/gif' ? 'gif' : 'jpg';
  const base = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) || 'image';
  const path = `site/uploads/${folder}/${Date.now()}-${base}.${ext}`;
  await uploadBytes(ref(services.storage, path), blob, { contentType: blob.type || file.type, cacheControl: 'public, max-age=3600' });
  return path;
}

const urlCache = new Map<string, Promise<string>>();

/**
 * Preview URL for an image field. Values starting with "site/" live in Cloud Storage; anything else
 * is a repo path that hasn't been through the admin panel (shown from the last seeded copy).
 */
export function useImageUrl(services: FirebaseServices, path: string | undefined) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    setUrl(undefined);
    if (!path) return;
    const storagePath = path.startsWith('site/') ? path : `site/${path}`;
    if (!urlCache.has(storagePath)) urlCache.set(storagePath, getDownloadURL(ref(services.storage, storagePath)));
    let live = true;
    urlCache.get(storagePath)!.then(
      (u) => live && setUrl(u),
      () => live && setUrl(''),
    );
    return () => {
      live = false;
    };
  }, [services, path]);
  return url;
}

/** Deep equality that ignores object key order (Firestore returns map keys sorted). */
export function same(a: unknown, b: unknown): boolean {
  const norm = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(norm);
    if (v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
      return Object.fromEntries(
        Object.keys(v as Record<string, unknown>)
          .sort()
          .filter((k) => (v as Record<string, unknown>)[k] !== undefined)
          .map((k) => [k, norm((v as Record<string, unknown>)[k])]),
      );
    }
    return v;
  };
  return JSON.stringify(norm(a)) === JSON.stringify(norm(b));
}
