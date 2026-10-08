import { timingSafeEqual } from 'crypto';
import { shopEnv } from '../shopEnv';

function safeEqual(a, b) {
  const x = Buffer.from(String(a ?? ''));
  const y = Buffer.from(String(b ?? ''));
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

export function checkAdminPassword(shop, password) {
  const real = shopEnv(shop.id, 'ADMIN_PASSWORD') || process.env.ADMIN_PASSWORD || '';
  return real !== '' && safeEqual(password, real);
}

export function checkWipePassword(shop, password) {
  const real = shopEnv(shop.id, 'WIPE_PASSWORD') || process.env.WIPE_PASSWORD || '';
  return real !== '' && safeEqual(password, real);
}