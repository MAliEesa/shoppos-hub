import { NextResponse } from 'next/server';
import { withShop } from '@/lib/server/withShop';
import { sendWipeAlert } from '@/lib/server/services/alerts';

export const POST = withShop(async (req, shop) => {
  await sendWipeAlert(shop);
  return NextResponse.json({ ok: true });
});