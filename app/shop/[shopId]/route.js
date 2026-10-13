import { getShop } from '@/lib/shops.config';
import { renderFeaturePage } from '@/lib/server/assemble';

export const dynamic = 'force-dynamic';

export async function GET(req, ctx) {
  const { shopId } = await ctx.params;
  const shop = getShop(shopId);
  if (!shop) return new Response('Shop not found', { status: 404 });

  return new Response(renderFeaturePage('pos', shop), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}