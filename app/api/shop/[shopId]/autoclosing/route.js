import { NextResponse } from 'next/server';
import { withShop } from '@/lib/server/withShop';
import { runAutoClosing } from '@/lib/server/services/closing';

export const dynamic = 'force-dynamic';

export const GET = withShop(async (req, shop) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await runAutoClosing(shop);
  return NextResponse.json(result);
});