import { getAuth } from 'firebase-admin/auth';
import { getShopAdminApp } from '../firebaseAdmin';
import { withTimeout } from './devices';

// Checks that the request comes from someone logged in to THIS shop.
// Returns the user's id, or null if there is no valid login.
export async function verifyShopUser(req, shop) {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  try {
    const decoded = await withTimeout(getAuth(getShopAdminApp(shop)).verifyIdToken(token));
    return decoded.uid;
  } catch (e) {
    console.error('verifyShopUser failed', e?.code || e?.message);
    return null;
  }
}