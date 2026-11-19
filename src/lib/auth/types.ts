export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
  emailVerified: boolean;
  isSuperAdmin: boolean;
}

export interface PublicFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}
