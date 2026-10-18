import { NextResponse } from 'next/server';
import { cert } from 'firebase-admin/app';
import { SHOPS } from '@/lib/shops.config';
import { shopEnv } from '@/lib/server/shopEnv';
import { getShopAdminApp } from '@/lib/server/firebaseAdmin';
import { getDatabase } from 'firebase-admin/database';

export const dynamic = 'force-dynamic';

function timeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(label + ' (no answer in ' + ms / 1000 + 's)')), ms)),
  ]);
}

// TEMPORARY test page. Shows what is wrong with the server's Firebase keys. Never shows the secret values.
export async function GET() {
  const out = [];
  for (const shop of SHOPS) {
    const r = { shop: shop.id, configProject: shop.firebaseConfig.projectId };
    const projectId = shopEnv(shop.id, 'FIREBASE_PROJECT_ID').trim();
    const email = shopEnv(shop.id, 'FIREBASE_CLIENT_EMAIL');
    const rawKey = shopEnv(shop.id, 'FIREBASE_PRIVATE_KEY');

    r.envProjectId = projectId || 'MISSING';
    r.projectIdMatchesConfig = projectId === shop.firebaseConfig.projectId;
    r.emailProject = email.includes('@') ? email.split('@')[1].replace('.iam.gserviceaccount.com', '') : 'MISSING or not an email';
    r.emailMatchesConfig = r.emailProject === shop.firebaseConfig.projectId;
    r.emailHasSpaceOrQuote = email !== email.trim() || /["']/.test(email);

    r.keyLength = rawKey.length;
    r.keyStartsWithQuote = /^["']/.test(rawKey);
    r.keyEndsWithQuote = /["']$/.test(rawKey);
    r.keyHasLiteralBackslashN = rawKey.includes('\\n');
    r.keyHasRealNewlines = rawKey.includes('\n');
    const key = rawKey.replace(/\\n/g, '\n');
    r.keyStartsCorrectly = key.startsWith('-----BEGIN PRIVATE KEY-----');
    r.keyEndsCorrectly = key.trim().endsWith('-----END PRIVATE KEY-----');

    try {
      const cred = cert({ projectId, clientEmail: email, privateKey: key });
      r.keyParses = true;
      try {
        const token = await timeout(cred.getAccessToken(), 8000, 'Google login');
        r.googleAcceptsKey = !!token?.access_token;
      } catch (e) {
        r.googleAcceptsKey = false;
        r.googleError = String(e.message || e).slice(0, 300);
      }
    } catch (e) {
      r.keyParses = false;
      r.parseError = String(e.message || e).slice(0, 300);
    }

    try {
      const db = getDatabase(getShopAdminApp(shop));
      await timeout(db.ref('/adminDeviceCounter').once('value'), 6000, 'Database read');
      r.databaseRead = 'ok';
    } catch (e) {
      r.databaseRead = String(e.message || e).slice(0, 200);
    }
    out.push(r);
  }
  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}