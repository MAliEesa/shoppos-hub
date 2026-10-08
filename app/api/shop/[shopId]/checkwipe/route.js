import { NextResponse } from 'next/server';
import { withShop } from '@/lib/server/withShop';
import { checkWipePassword } from '@/lib/server/services/passwords';

export const POST = withShop(async (req, shop) => {
  const { password } = await req.json().catch(() => ({}));
  return NextResponse.json({ ok: checkWipePassword(shop, password) });
});