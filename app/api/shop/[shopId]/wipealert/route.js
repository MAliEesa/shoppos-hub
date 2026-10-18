import { NextResponse } from 'next/server';
import { withShop } from '@/lib/server/withShop';
import { sendWipeAlert } from '@/lib/server/services/alerts';
import { verifyShopUser } from '@/lib/server/services/auth';

export const POST = withShop(async (req, shop) => {
  const user = await verifyShopUser(req, shop);
  if (!user) return NextResponse.json({ ok: false, error: 'Not logged in' }, { status: 401 });

  await sendWipeAlert(shop);
  return NextResponse.json({ ok: true });
});