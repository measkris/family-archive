'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
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
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function syncServerSession(fbUser: User): Promise<AuthUser> {
  const idToken = await fbUser.getIdToken(true);
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const data = (await res.json()) as { user?: AuthUser; error?: string };
  if (!res.ok || !data.user) {
    throw new Error(data.error || 'Failed to verify authentication session.');
  }
  return data.user;
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

  useEffect(() => {
    if (!auth) {
      return;
    }

    const unsubscribe = onIdTokenChanged(auth, async (nextFbUser) => {
      setFbUser(nextFbUser);
      if (!nextFbUser) {
        try {
          await fetch('/api/auth/session', { method: 'DELETE' });
        } catch {
          // ignore cleanup failure
        }
        setUser((prev) => {
          if (prev !== null) onSessionChanged?.(null);
          return null;
        });
        setLoading(false);
        return;
      }

      try {
        const verifiedUser = await syncServerSession(nextFbUser);
        setUser(verifiedUser);
        onSessionChanged?.(verifiedUser);
      } catch {
        // Fallback minimal client info if offline; API routes will still enforce token
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, onSessionChanged]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!auth) throw new Error('Firebase Authentication is not configured.');
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const verified = await syncServerSession(cred.user);
      setFbUser(cred.user);
      setUser(verified);
      onSessionChanged?.(verified);
      return verified;
    },
    [auth, onSessionChanged]
  );

  const registerWithEmail = useCallback(
    async (email: string, password: string, displayName: string) => {
      if (!auth) throw new Error('Firebase Authentication is not configured.');
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      }
      const verified = await syncServerSession(cred.user);
      setFbUser(cred.user);
      setUser(verified);
      onSessionChanged?.(verified);
      return verified;
    },
    [auth, onSessionChanged]
  );

  const signInWithGoogle = useCallback(async () => {
    if (!auth) throw new Error('Firebase Authentication is not configured.');
    const provider = getGoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const verified = await syncServerSession(cred.user);
    setFbUser(cred.user);
    setUser(verified);
    onSessionChanged?.(verified);
    return verified;
  }, [auth, onSessionChanged]);

  const signOut = useCallback(async () => {
    if (auth) {
      await firebaseSignOut(auth);
    }
    await fetch('/api/auth/session', { method: 'DELETE' });
    setFbUser(null);
    setUser(null);
    onSessionChanged?.(null);
  }, [auth, onSessionChanged]);

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
