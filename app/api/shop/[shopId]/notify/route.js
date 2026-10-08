import { NextResponse } from 'next/server';
import { withShop } from '@/lib/server/withShop';
import { sendSaleNotification } from '@/lib/server/services/notifications';

export const POST = withShop(async (req, shop) => {
  const { total, itemCount } = await req.json().catch(() => ({}));
  try {
    const result = await sendSaleNotification(shop, { total, itemCount });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
});