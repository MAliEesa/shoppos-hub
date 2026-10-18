import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { shopEnv } from './shopEnv';

// TEMPORARY: in Vercel the three FIREBASE_* values were saved under the wrong shop name
// (the SHOP1 ones belong to shop2's project and the SHOP2 ones to shop1's project).
// This reads them from the other box. Remove this once the names are fixed in Vercel.
const KEY_BOX = { shop1: 'shop2', shop2: 'shop1' };
const keyBox = (shopId) => KEY_BOX[shopId] || shopId;

// One separate Firebase admin connection per shop. Never mixes shop data.
export function getShopAdminApp(shop) {
  const existing = getApps().find((a) => a.name === shop.id);
  if (existing) return existing;

  return initializeApp(
    {
      credential: cert({
        projectId: shopEnv(keyBox(shop.id), 'FIREBASE_PROJECT_ID'),
        clientEmail: shopEnv(keyBox(shop.id), 'FIREBASE_CLIENT_EMAIL'),
        privateKey: shopEnv(keyBox(shop.id), 'FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
      }),
      databaseURL: shop.firebaseConfig.databaseURL,
    },
    shop.id
  );
}