import { NextResponse } from 'next/server';
import { withShop } from '@/lib/server/withShop';
import { sendSaleNotification } from '@/lib/server/services/notifications';
import { verifyShopUser } from '@/lib/server/services/auth';

export const POST = withShop(async (req, shop) => {
const user = await verifyShopUser(req, shop);
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const amount = Math.round(Number(body.total));
  const itemCount = Math.floor(Number(body.itemCount));
  if (!Number.isFinite(amount) || amount < 0 || amount > 1e9 || !Number.isFinite(itemCount) || itemCount < 1 || itemCount > 9999) {
    return NextResponse.json({ error: 'Bad data' }, { status: 400 });
  }
  const total = String(amount);
  try {
    const result = await sendSaleNotification(shop, { total, itemCount });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
});