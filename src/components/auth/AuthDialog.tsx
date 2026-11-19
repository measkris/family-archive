'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  ExternalLink,
  Loader2,
  Lock,
  LogIn,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/primitives';
import { useAuth } from './AuthContext';
import { useLanguage } from '@/components/i18n/LanguageContext';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'login' | 'register';
}

function mapFirebaseAuthError(err: unknown): { message: string; isConfigMissing: boolean } {
  const raw = err instanceof Error ? err.message : String(err || '');
  if (
    raw.includes('auth/configuration-not-found') ||
    raw.includes('auth/operation-not-allowed')
  ) {
    return {
      isConfigMissing: true,
      message:
        'Firebase Authentication providers (Email/Password & Google) are not enabled yet in Firebase Console for this project.',
    };
  }
  if (raw.includes('auth/email-already-in-use')) {
    return {
      isConfigMissing: false,
      message: 'An account with this email already exists. Try signing in instead.',
    };
  }
  if (
    raw.includes('auth/invalid-credential') ||
    raw.includes('auth/wrong-password') ||
    raw.includes('auth/user-not-found')
  ) {
    return { isConfigMissing: false, message: 'Invalid email or password.' };
  }
  if (raw.includes('auth/weak-password')) {
    return {
      isConfigMissing: false,
      message: 'Password should be at least 6 characters long.',
    };
  }
  if (raw.includes('auth/popup-closed-by-user')) {
    return { isConfigMissing: false, message: 'Google sign-in popup was closed before finishing.' };
  }
  return { isConfigMissing: false, message: raw || 'Authentication failed.' };
}

export function AuthDialog({
  open,
  onOpenChange,
  defaultTab = 'login',
}: AuthDialogProps) {
  const {
    signInWithEmail,
    registerWithEmail,
    signInWithGoogle,
    signInWithGoogleRedirect,
    firebaseConfig,
  } = useAuth();
  const { t } = useLanguage();
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorState, setErrorState] = useState<{
    message: string;
    isConfigMissing: boolean;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setErrorState(null);
    setBusy(true);
    try {
      if (tab === 'login') {
        await signInWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, displayName);
      }
      onOpenChange(false);
    } catch (err) {
      setErrorState(mapFirebaseAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setErrorState(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      onOpenChange(false);
    } catch (err) {
      setErrorState(mapFirebaseAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleRedirect = async () => {
    setErrorState(null);
    setBusy(true);
    try {
      await signInWithGoogleRedirect();
    } catch (err) {
      setErrorState(mapFirebaseAuthError(err));
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-1.5rem)] sm:max-w-md bg-[#fcfaf6] border-stone-200">
        <DialogHeader>
          <DialogTitle className="font-heritage text-2xl flex items-center gap-2 text-stone-900">
            <ShieldCheck className="size-5 text-[#73a922]" />
            {t.authTitle}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-stone-600">
            {t.authDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => void handleGoogle()}
            className="w-full h-10 bg-white border-stone-300 hover:bg-stone-50 text-stone-800 font-semibold text-xs sm:text-sm gap-2.5 shadow-2xs"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
            )}
            {t.continueWithGoogle}
          </Button>

          <div className="text-center -mt-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleGoogleRedirect()}
              className="text-[11px] font-medium text-[#0b4a68] hover:underline cursor-pointer disabled:opacity-50"
            >
              {t.googleFullPageFallback}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-stone-200" />
            <span className="shrink-0 whitespace-nowrap text-[11px] font-medium uppercase tracking-wider text-stone-400">
              {t.orWithEmail}
            </span>
            <div className="h-px flex-1 bg-stone-200" />
          </div>

          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as 'login' | 'register');
              setErrorState(null);
            }}
          >
            <TabsList className="grid w-full grid-cols-2 bg-stone-100">
              <TabsTrigger value="login" className="gap-1.5 text-xs">
                <LogIn className="size-3.5" /> {t.signInTab}
              </TabsTrigger>
              <TabsTrigger value="register" className="gap-1.5 text-xs">
                <UserPlus className="size-3.5" /> {t.registerTab}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={tab} className="pt-3">
              <form onSubmit={handleSubmit} className="space-y-3">
                {tab === 'register' && (
                  <div className="space-y-1">
                    <Label htmlFor="auth-name" className="text-xs">
                      Full Name
                    </Label>
                    <Input
                      id="auth-name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Maurits Lang"
                      className="h-9 bg-white text-sm"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="auth-email" className="text-xs">
                    Email Address
                  </Label>
                  <Input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-9 bg-white text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="auth-password" className="text-xs">
                    Password
                  </Label>
                  <Input
                    id="auth-password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="h-9 bg-white text-sm"
                  />
                </div>

                {errorState && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-600" />
                      <span>{errorState.message}</span>
                    </div>
                    {errorState.isConfigMissing && firebaseConfig?.projectId && (
                      <a
                        href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#0b4a68] underline"
                      >
                        Enable Email/Password &amp; Google in Firebase Console{' '}
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full h-9 bg-[#73a922] hover:bg-[#5e8b1b] text-white font-semibold text-xs sm:text-sm"
                >
                  {busy ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Please wait...
                    </>
                  ) : tab === 'login' ? (
                    <>
                      <Lock className="size-3.5" /> Sign In with Email
                    </>
                  ) : (
                    <>
                      <UserPlus className="size-3.5" /> Create Free Account
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
