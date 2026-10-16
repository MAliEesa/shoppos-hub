import { NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from './lib/session';
import { SHOPS } from './lib/shops.config';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

const AUTOCLOSE = /^\/api\/shop\/[^/]+\/autoclosing$/;

export async function middleware(req) {
  const host = (req.headers.get('host') || '').toLowerCase();
  const path = req.nextUrl.pathname;

  // The nightly closing job calls this itself (it has its own secret).
  if (AUTOCLOSE.test(path)) return NextResponse.next();

  // A shop's own address: only that one shop exists here.
  const shop = SHOPS.find((s) => s.host === host);
  if (shop) {
    if (path === '/') {
      return NextResponse.rewrite(new URL(`/shop/${shop.id}`, req.url));
    }
    const base = `/shop/${shop.id}`;
    const api = `/api/shop/${shop.id}/`;
    const mine = path === base || path.startsWith(base + '/') || path.startsWith(api);
    if (mine || path === '/version.json') return NextResponse.next();
    return new NextResponse('Not found', { status: 404 });
  }

  // The hub address: hub password needed, exactly as before.
  if (path === '/login' || path === '/api/session' || path === '/version.json') {
    return NextResponse.next();
  }
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const payload = token ? await verifySessionToken(token) : null;
  if (!payload) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', path);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}