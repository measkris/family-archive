'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { getFirebaseClientAuth, getGoogleAuthProvider } from '@/lib/auth/client';
import type { AuthUser, PublicFirebaseConfig } from '@/lib/auth/types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  firebaseConfig: PublicFirebaseConfig | null;
  signInWithEmail: (email: string, password: string) => Promise<AuthUser>;
  registerWithEmail: (email: string, password: string, displayName: string) => Promise<AuthUser>;
  signInWithGoogle: () => Promise<AuthUser>;
  signInWithGoogleRedirect: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function syncServerSession(
  fbUser: User,
  forceRefresh = false
): Promise<{ user: AuthUser; idToken: string }> {
  const idToken = await fbUser.getIdToken(forceRefresh);
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const data = (await res.json()) as { user?: AuthUser; error?: string };
  if (!res.ok || !data.user) {
    throw new Error(data.error || 'Failed to verify authentication session.');
  }
  return { user: data.user, idToken };
}

function buildFallbackUser(fbUser: User, prev: AuthUser | null): AuthUser {
  const sameUser = prev && prev.uid === fbUser.uid;
  return {
    uid: fbUser.uid,
    email: (fbUser.email || prev?.email || '').trim().toLowerCase(),
    displayName: fbUser.displayName?.trim() || prev?.displayName,
    photoUrl: fbUser.photoURL?.trim() || prev?.photoUrl,
    emailVerified: fbUser.emailVerified,
    isSuperAdmin: sameUser ? prev.isSuperAdmin : false,
  };
}

export function AuthProvider({
  children,
  initialUser,
  firebaseConfig,
  onSessionChanged,
}: {
  children: React.ReactNode;
  initialUser: AuthUser | null;
  firebaseConfig: PublicFirebaseConfig | null;
  onSessionChanged?: (user: AuthUser | null) => void;
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [fbUser, setFbUser] = useState<User | null>(null);
  const auth = useMemo(() => getFirebaseClientAuth(firebaseConfig), [firebaseConfig]);
  const [loading, setLoading] = useState<boolean>(Boolean(auth));

  const onSessionChangedRef = useRef(onSessionChanged);
  const userRef = useRef<AuthUser | null>(initialUser);
  const lastSyncedTokenRef = useRef<string>('');
  const syncInFlightRef = useRef<Promise<AuthUser | null> | null>(null);

  useEffect(() => {
    onSessionChangedRef.current = onSessionChanged;
  }, [onSessionChanged]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const performSessionSync = useCallback(
    async (nextFbUser: User, forceRefresh = false): Promise<AuthUser | null> => {
      try {
        const token = await nextFbUser.getIdToken(forceRefresh);
        if (!forceRefresh && token === lastSyncedTokenRef.current && userRef.current?.uid === nextFbUser.uid) {
          return userRef.current;
        }
        const { user: verifiedUser, idToken } = await syncServerSession(nextFbUser, false);
        lastSyncedTokenRef.current = idToken;
        const changedUid = userRef.current?.uid !== verifiedUser.uid;
        setUser(verifiedUser);
        if (changedUid) {
          onSessionChangedRef.current?.(verifiedUser);
        }
        return verifiedUser;
      } catch {
        // Keep user signed in locally on transient network/API glitches instead of logging them out
        const fallback = buildFallbackUser(nextFbUser, userRef.current);
        setUser(fallback);
        return fallback;
      }
    },
    []
  );

  useEffect(() => {
    if (!auth) {
      return;
    }

    getRedirectResult(auth)
      .then(async (cred) => {
        if (!cred?.user) return;
        setFbUser(cred.user);
        await performSessionSync(cred.user, false);
      })
      .catch(() => {
        // Ignore empty or cancelled redirect attempts
      });

    const unsubscribe = onIdTokenChanged(auth, async (nextFbUser) => {
      setFbUser(nextFbUser);
      if (!nextFbUser) {
        lastSyncedTokenRef.current = '';
        try {
          await fetch('/api/auth/session', { method: 'DELETE' });
        } catch {
          // ignore cleanup failure
        }
        if (userRef.current !== null) {
          setUser(null);
          onSessionChangedRef.current?.(null);
        } else {
          setUser(null);
        }
        setLoading(false);
        return;
      }

      if (!syncInFlightRef.current) {
        syncInFlightRef.current = performSessionSync(nextFbUser, false).finally(() => {
          syncInFlightRef.current = null;
          setLoading(false);
        });
      }
      await syncInFlightRef.current;
    });

    // Proactively refresh the session cookie every 45 minutes so idle tabs stay signed in
    const keepaliveTimer = setInterval(async () => {
      const current = auth.currentUser;
      if (current) {
        await performSessionSync(current, true);
      }
    }, 45 * 60 * 1000);

    return () => {
      clearInterval(keepaliveTimer);
      unsubscribe();
    };
  }, [auth, performSessionSync]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!auth) throw new Error('Firebase Authentication is not configured.');
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const { user: verified, idToken } = await syncServerSession(cred.user, false);
      lastSyncedTokenRef.current = idToken;
      setFbUser(cred.user);
      setUser(verified);
      onSessionChangedRef.current?.(verified);
      return verified;
    },
    [auth]
  );

  const registerWithEmail = useCallback(
    async (email: string, password: string, displayName: string) => {
      if (!auth) throw new Error('Firebase Authentication is not configured.');
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      }
      const { user: verified, idToken } = await syncServerSession(cred.user, true);
      lastSyncedTokenRef.current = idToken;
      setFbUser(cred.user);
      setUser(verified);
      onSessionChangedRef.current?.(verified);
      return verified;
    },
    [auth]
  );

  const signInWithGoogle = useCallback(async () => {
    if (!auth) throw new Error('Firebase Authentication is not configured.');
    const provider = getGoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const { user: verified, idToken } = await syncServerSession(cred.user, false);
    lastSyncedTokenRef.current = idToken;
    setFbUser(cred.user);
    setUser(verified);
    onSessionChangedRef.current?.(verified);
    return verified;
  }, [auth]);

  const signInWithGoogleRedirect = useCallback(async () => {
    if (!auth) throw new Error('Firebase Authentication is not configured.');
    const provider = getGoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  }, [auth]);

  const signOut = useCallback(async () => {
    lastSyncedTokenRef.current = '';
    if (auth) {
      await firebaseSignOut(auth);
    }
    await fetch('/api/auth/session', { method: 'DELETE' });
    setFbUser(null);
    setUser(null);
    onSessionChangedRef.current?.(null);
  }, [auth]);

  const getIdToken = useCallback(async () => {
    const activeFbUser = auth?.currentUser || fbUser;
    if (!activeFbUser) return null;
    try {
      return await activeFbUser.getIdToken();
    } catch {
      return null;
    }
  }, [auth, fbUser]);

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      const token = await getIdToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return fetch(input, { ...init, headers });
    },
    [getIdToken]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      firebaseConfig,
      signInWithEmail,
      registerWithEmail,
      signInWithGoogle,
      signInWithGoogleRedirect,
      signOut,
      getIdToken,
      authFetch,
    }),
    [
      user,
      loading,
      firebaseConfig,
      signInWithEmail,
      registerWithEmail,
      signInWithGoogle,
      signInWithGoogleRedirect,
      signOut,
      getIdToken,
      authFetch,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
