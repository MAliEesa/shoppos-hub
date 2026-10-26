import { createHash, randomBytes } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { getDatabase } from 'firebase-admin/database';
import { getShopAdminApp } from '../firebaseAdmin';

// Remembered devices for the shop admin area.
// Each browser gets a random ID in a cookie (the cookie holds no password).
// The database only stores a scrambled (hashed) copy of that ID, a name, and a yes/no "approved".

export const DEVICE_COOKIE = 'shop_device';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // 400 days, refreshed every time the device is used

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET);
const hashId = (id) => createHash('sha256').update(id).digest('hex');
const db = (shop) => getDatabase(getShopAdminApp(shop));
const listRef = (shop) => db(shop).ref('/adminDevices');

// Never let a slow or broken database freeze a page: stop waiting after 5 seconds.
export function withTimeout(promise, ms = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Database did not answer in time')), ms)),
  ]);
}

async function readId(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.d === 'string' ? payload.d : null;
  } catch {
    return null;
  }
}

export function setDeviceCookie(res, token) {
  res.cookies.set(DEVICE_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
}

// Called after a correct admin password: makes sure this browser has an ID and is on the list.
export async function registerDevice(req, shop) {
  const oldToken = req.cookies.get(DEVICE_COOKIE)?.value;
  let id = await readId(oldToken);
  let token = oldToken;
  if (!id) {
    id = randomBytes(16).toString('hex');
    token = await new SignJWT({ d: id }).setProtectedHeader({ alg: 'HS256' }).sign(secret());
  }

  const ref = listRef(shop).child(hashId(id));
  const now = new Date().toISOString();
  const snap = await ref.once('value');
  if (snap.exists()) {
    await ref.update({ lastSeen: now });
  } else {
    const counter = await db(shop).ref('/adminDeviceCounter').transaction((n) => (n || 0) + 1);
    const n = counter.snapshot.val();
    await ref.set({ name: `Dev ${n}`, approved: false, createdAt: now, lastSeen: now });
  }
  return { token };
}

// Called when the admin screen is opened: is this browser on the approved list?
export async function checkDevice(req, shop) {
  const token = req.cookies.get(DEVICE_COOKIE)?.value;
  const id = await readId(token);
  if (!id) return { ok: false, token: null };

  const ref = listRef(shop).child(hashId(id));
  const snap = await ref.once('value');
  const v = snap.val();
  if (!v || v.approved !== true) return { ok: false, token };
  const last = Date.parse(v.lastSeen || '') || 0;
  if (Date.now() - last > 6 * 60 * 60 * 1000) {
    ref.update({ lastSeen: new Date().toISOString() }).catch(() => {});
  }
  return { ok: true, token };
}

// ---- used by the hub Settings page ----

export async function listDevices(shop) {
  const snap = await listRef(shop).once('value');
  const val = snap.val() || {};
  return Object.entries(val)
    .map(([key, v]) => ({
      key,
      name: v.name || 'Device',
      approved: v.approved === true,
      createdAt: v.createdAt || null,
      lastSeen: v.lastSeen || null,
    }))
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
}

export async function updateDevice(shop, key, patch) {
  const ref = listRef(shop).child(key);
  const snap = await ref.once('value');
  if (!snap.exists()) return false;
  await ref.update(patch);
  return true;
}

export async function removeDevice(shop, key) {
  await listRef(shop).child(key).remove();
  return true;
}