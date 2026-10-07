import { HttpsError } from 'firebase-functions/https';

/**
 * Throws unless the caller is signed in with a verified email listed in the admins collection.
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {{ auth?: { token: Record<string, unknown> } }} request
 */
export async function assertAdmin(db, request) {
  const token = request.auth?.token;
  if (!token) throw new HttpsError('unauthenticated', 'Please sign in.');
  const email = typeof token.email === 'string' ? token.email.toLowerCase() : '';
  if (!email || token.email_verified !== true) throw new HttpsError('permission-denied', 'Your email is not verified.');
  const admin = await db.doc(`admins/${email}`).get();
  if (!admin.exists) throw new HttpsError('permission-denied', 'You are not an admin.');
  return email;
}
