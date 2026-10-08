import { NextResponse } from 'next/server';
import { withShop } from '@/lib/server/withShop';
import { checkAdminPassword } from '@/lib/server/services/passwords';

export const POST = withShop(async (req, shop) => {
  const { password } = await req.json().catch(() => ({}));
  if (checkAdminPassword(shop, password)) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
});