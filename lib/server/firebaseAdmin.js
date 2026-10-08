import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { shopEnv } from './shopEnv';

// One separate Firebase admin connection per shop. Never mixes shop data.
export function getShopAdminApp(shop) {
  const existing = getApps().find((a) => a.name === shop.id);
  if (existing) return existing;

  return initializeApp(
    {
      credential: cert({
        projectId: shopEnv(shop.id, 'FIREBASE_PROJECT_ID'),
        clientEmail: shopEnv(shop.id, 'FIREBASE_CLIENT_EMAIL'),
        privateKey: shopEnv(shop.id, 'FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
      }),
      databaseURL: shop.firebaseConfig.databaseURL,
    },
    shop.id
  );
}