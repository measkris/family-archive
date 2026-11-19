import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { normalizeEmail } from './permissions';
import type { AuthUser, PublicFirebaseConfig } from './types';

export const SESSION_COOKIE_NAME = 'fa_session';

interface VerifiedTokenCacheEntry {
  user: AuthUser;
  expiresAt: number;
}

const verifiedTokenCache = new Map<string, VerifiedTokenCacheEntry>();
const CACHE_TTL_MS = 120_000;

export function getPublicFirebaseWebConfig(): PublicFirebaseConfig | null {
  const apiKey = process.env.FIREBASE_API_KEY?.trim();
  const authDomain = process.env.FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const appId = process.env.FIREBASE_APP_ID?.trim();

  if (!apiKey || !authDomain || !projectId || !appId) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET?.trim(),
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID?.trim(),
    appId,
  };
}

export function isSuperAdminAccount(email?: string | null, uid?: string | null): boolean {
  const configuredUids = (process.env.SUPER_ADMIN_UID || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  if (uid && configuredUids.includes(uid)) {
    return true;
  }

  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  const configuredEmails = (process.env.SUPER_ADMIN_EMAIL || '')
    .split(',')
    .map((v) => normalizeEmail(v))
    .filter(Boolean);

  return configuredEmails.includes(normalized);
}

function getJwtExpMs(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as {
      exp?: number;
    };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export async function verifyFirebaseIdToken(idToken: string): Promise<AuthUser | null> {
  const token = idToken.trim();
  if (!token) return null;

  const jwtExp = getJwtExpMs(token);
  if (jwtExp && jwtExp <= Date.now()) {
    verifiedTokenCache.delete(token);
    return null;
  }

  const cached = verifiedTokenCache.get(token);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.user;
  }

  const apiKey = process.env.FIREBASE_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    let res: Response | null = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        res = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(
            apiKey
          )}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: token }),
            signal: AbortSignal.timeout(5000),
          }
        );
        break;
      } catch {
        if (attempt === 2) return null;
      }
    }

    if (!res || !res.ok) {
      verifiedTokenCache.delete(token);
      return null;
    }

    const data = (await res.json()) as {
      users?: Array<{
        localId?: string;
        email?: string;
        displayName?: string;
        photoUrl?: string;
        emailVerified?: boolean;
      }>;
    };

    const rawUser = data.users?.[0];
    if (!rawUser?.localId || !rawUser.email) {
      return null;
    }

    const user: AuthUser = {
      uid: rawUser.localId,
      email: normalizeEmail(rawUser.email),
      displayName: rawUser.displayName?.trim() || undefined,
      photoUrl: rawUser.photoUrl?.trim() || undefined,
      emailVerified: Boolean(rawUser.emailVerified),
      isSuperAdmin: isSuperAdminAccount(rawUser.email, rawUser.localId),
    };

    const cacheUntil = Math.min(
      Date.now() + CACHE_TTL_MS,
      jwtExp ? jwtExp - 5000 : Date.now() + CACHE_TTL_MS
    );
    if (cacheUntil > Date.now()) {
      // Keep cache bounded
      if (verifiedTokenCache.size > 200) {
        verifiedTokenCache.clear();
      }
      verifiedTokenCache.set(token, { user, expiresAt: cacheUntil });
    }

    return user;
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser(request?: NextRequest): Promise<AuthUser | null> {
  let token = '';

  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.slice(7).trim();
    }
    if (!token) {
      token = request.cookies.get(SESSION_COOKIE_NAME)?.value || '';
    }
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value || '';
    } catch {
      return null;
    }
  }

  if (!token) return null;
  return verifyFirebaseIdToken(token);
}
