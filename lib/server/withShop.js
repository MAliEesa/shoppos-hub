import { NextResponse } from 'next/server';
import { getShop } from '@/lib/shops.config';

// Wraps an API handler: looks up the shop from the URL, 404s if it doesn't exist.
export function withShop(handler) {
  return async (req, ctx) => {
    const { shopId } = await ctx.params;
    const shop = getShop(shopId);
    if (!shop) {
      return NextResponse.json({ error: 'Unknown shop' }, { status: 404 });
    }
    return handler(req, shop);
  };
}