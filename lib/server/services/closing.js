import { getDatabase } from 'firebase-admin/database';
import { getShopAdminApp } from '../firebaseAdmin';

const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

function dateKey(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function runAutoClosing(shop) {
  const db = getDatabase(getShopAdminApp(shop));

  const now = new Date(Date.now() + PKT_OFFSET_MS);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = dateKey(yesterday);

  const existing = await db.ref(`/closings/${yesterdayKey}`).once('value');
  if (existing.val()) {
    return { message: `Already closed: ${yesterdayKey}` };
  }

  const salesSnap = await db.ref('/sales').once('value');
  const allSales = Object.values(salesSnap.val() || {});

  const yesterdaySales = allSales.filter(
    (s) => dateKey(new Date(new Date(s.time).getTime() + PKT_OFFSET_MS)) === yesterdayKey
  );

  const total = yesterdaySales.reduce((sum, s) => sum + s.total, 0);
  const closedAt = new Date().toISOString();

  await db.ref(`/closings/${yesterdayKey}`).set({
    date: yesterdayKey,
    total,
    transactions: yesterdaySales.length,
    closedAt,
    auto: true,
  });
  await db.ref('/sessionStart').set(closedAt);

  return { success: true, date: yesterdayKey, total, transactions: yesterdaySales.length };
}