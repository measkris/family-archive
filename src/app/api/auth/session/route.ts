import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedUser,
  SESSION_COOKIE_NAME,
  verifyFirebaseIdToken,
} from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  return NextResponse.json({ authenticated: Boolean(user), user });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { idToken?: string };
    const idToken = body.idToken?.trim();
    if (!idToken) {
      return NextResponse.json({ error: 'idToken is required' }, { status: 400 });
    }

    const user = await verifyFirebaseIdToken(idToken);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired Firebase authentication token' },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ authenticated: true, user });
    res.cookies.set(SESSION_COOKIE_NAME, idToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 3600,
    });
    return res;
  } catch (error) {
    console.error('POST /api/auth/session error:', error);
    return NextResponse.json({ error: 'Failed to create auth session' }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ authenticated: false, user: null });
  res.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
}
