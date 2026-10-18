import { NextResponse } from 'next/server';
import { SHOPS, getShop } from '@/lib/shops.config';
import { listDevices, updateDevice, removeDevice } from '@/lib/server/services/devices';

export const dynamic = 'force-dynamic';

// Hub only: the hub password is already required for this address by middleware.
export async function GET() {
  const shops = await Promise.all(
    SHOPS.map(async (s) => {
      const base = { id: s.id, name: s.name, accentColor: s.accentColor };
      try {
        return { ...base, devices: await listDevices(s) };
      } catch (e) {
        console.error('listDevices failed', s.id, e);
        return { ...base, devices: [], error: true };
      }
    })
  );
  return NextResponse.json({ shops });
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const shop = getShop(body.shopId);
  if (!shop || !/^[a-f0-9]{64}$/.test(String(body.key || ''))) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    if (body.action === 'approve') {
      await updateDevice(shop, body.key, { approved: true });
    } else if (body.action === 'unapprove') {
      await updateDevice(shop, body.key, { approved: false });
    } else if (body.action === 'rename') {
      const name = String(body.name || '').trim().slice(0, 30);
      if (!name) return NextResponse.json({ ok: false }, { status: 400 });
      await updateDevice(shop, body.key, { name });
    } else if (body.action === 'remove') {
      await removeDevice(shop, body.key);
    } else {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('devices action failed', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}