import { NextResponse } from 'next/server';
import { withShop } from '@/lib/server/withShop';
import { checkLimitedAdminPassword } from '@/lib/server/services/passwords';

export const dynamic = 'force-dynamic';

export const POST = withShop(async (req, shop) => {
  const { password } = await req.json().catch(() => ({}));
  if (checkLimitedAdminPassword(shop, password)) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
});