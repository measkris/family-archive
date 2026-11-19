'use client';

import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import type { PublicFirebaseConfig } from './types';

let clientApp: FirebaseApp | null = null;
let clientAuth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

export function getFirebaseClientAuth(config: PublicFirebaseConfig | null): Auth | null {
  if (!config || !config.apiKey || !config.projectId || !config.appId) {
    return null;
  }
  if (!clientApp) {
    const existing = getApps().find((a) => a.name === 'family-archive-client');
    clientApp = existing || initializeApp(config, 'family-archive-client');
  }
  if (!clientAuth) {
    clientAuth = getAuth(clientApp);
  }
  return clientAuth;
}

export function getGoogleAuthProvider(): GoogleAuthProvider {
  if (!googleProvider) {
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  }
  return googleProvider;
}
