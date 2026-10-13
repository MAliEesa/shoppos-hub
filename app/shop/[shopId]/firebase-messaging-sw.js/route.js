import { getShop } from '@/lib/shops.config';
import { renderPushWorker } from '@/lib/server/pushWorker';

export const dynamic = 'force-dynamic';

export async function GET(req, ctx) {
  const { shopId } = await ctx.params;
  const shop = getShop(shopId);
  if (!shop) return new Response('Shop not found', { status: 404 });

  return new Response(renderPushWorker(shop), {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}