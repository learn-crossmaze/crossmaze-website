import { HttpsError } from 'firebase-functions/https';

/**
 * Checks that the caller is signed in with a verified email on the admin list, and returns it.
 * With { branchAdmins: true } branch admins (/branchAdmins, who may only write blog posts and their
 * centre head's profile) are let in too.
 */
export async function assertAdmin(db, request, { branchAdmins = false } = {}) {
  const token = request.auth?.token;
  if (!token) throw new HttpsError('unauthenticated', 'Please sign in.');
  const email = typeof token.email === 'string' ? token.email.toLowerCase() : '';
  if (!email || token.email_verified !== true) throw new HttpsError('permission-denied', 'Your email is not verified.');
  const admin = await db.doc(`admins/${email}`).get();
  if (admin.exists) return email;
  if (branchAdmins && (await db.doc(`branchAdmins/${email}`).get()).exists) return email;
  throw new HttpsError('permission-denied', 'You are not an admin.');
}
