  import { NextResponse } from 'next/server';
  import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from '@/lib/session';

  export async function POST(req) {
    const { password } = await req.json();

    if (password !== process.env.HUB_PASSWORD) {
      return NextResponse.json({ ok: false, error: 'Wrong password' }, { status: 401 });
    }

    const token = await createSessionToken({ hub: true });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  }

  export async function DELETE() {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE_NAME, '', { path: '/', maxAge: 0 });
    return res;
  }