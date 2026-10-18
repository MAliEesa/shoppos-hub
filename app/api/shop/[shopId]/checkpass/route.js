import { NextResponse } from 'next/server';
import { withShop } from '@/lib/server/withShop';
import { checkAdminPassword } from '@/lib/server/services/passwords';
import { registerDevice, checkDevice, setDeviceCookie } from '@/lib/server/services/devices';

export const dynamic = 'force-dynamic';

export const POST = withShop(async (req, shop) => {
  const { password } = await req.json().catch(() => ({}));
  if (checkAdminPassword(shop, password)) {
    const res = NextResponse.json({ ok: true });
    try {
      const { token } = await registerDevice(req, shop);
      if (token) setDeviceCookie(res, token);
    } catch (e) {
      console.error('registerDevice failed', e);
    }
    return res;
  }
  return NextResponse.json({ ok: false }, { status: 401 });
});

// Asked when the admin screen opens: is this device approved to skip the password?
export const GET = withShop(async (req, shop) => {
  try {
    const { ok, token } = await checkDevice(req, shop);
    const res = NextResponse.json({ ok }, { headers: { 'Cache-Control': 'no-store' } });
    if (token) setDeviceCookie(res, token);
    return res;
  } catch (e) {
    console.error('checkDevice failed', e);
    return NextResponse.json({ ok: false });
  }
});