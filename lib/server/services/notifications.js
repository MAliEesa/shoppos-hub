import { getDatabase } from 'firebase-admin/database';
import { getMessaging } from 'firebase-admin/messaging';
import { getShopAdminApp } from '../firebaseAdmin';

export async function sendSaleNotification(shop, { total, itemCount }) {
  const app = getShopAdminApp(shop);

  const snap = await getDatabase(app).ref('/fcmTokens').once('value');
  const tokens = snap.val();
  if (!tokens) return { sent: 0 };

  const tokenList = [...new Set(Object.values(tokens).map((t) => t.token))];
  const messaging = getMessaging(app);

  const results = await Promise.allSettled(
    tokenList.map((token) =>
      messaging.send({
        token,
        data: {
          title: `🛍 ${shop.name}: New Sale!`,
          body: `Rs. ${total} — ${itemCount} item${itemCount > 1 ? 's' : ''}`,
        },
      })
    )
  );

  return { sent: results.filter((r) => r.status === 'fulfilled').length };
}