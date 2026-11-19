import {
  FirebaseDatabaseAdapter,
  FirestoreSetupError,
  isFirebaseConfigured,
} from './firebase-adapter';
import type { DatabaseAdapter, DatabaseStatus } from './types';

let adapterInstance: FirebaseDatabaseAdapter | null = null;

/**
 * Primary database accessor — loads and writes exclusively to Google Cloud Firestore.
 */
export function getDatabase(): DatabaseAdapter {
  if (!adapterInstance) {
    adapterInstance = new FirebaseDatabaseAdapter();
  }
  return adapterInstance;
}

export async function getDatabaseStatus(): Promise<DatabaseStatus> {
  const db = getDatabase();
  await db.ensureSeeded();
  const [members, archives, heritage] = await Promise.all([
    db.getAllMembers(),
    db.getArchivalRecords(),
    db.getHeritageOrigins(),
  ]);

  return {
    provider: db.provider,
    label: db.label,
    description: db.description,
    location: db.location,
    isCloud: db.isCloud,
    memberCount: members.length,
    archiveCount: archives.length,
    heritageCount: heritage.length,
  };
}

export { FirestoreSetupError, isFirebaseConfigured };
export type { DatabaseAdapter, DatabaseStatus, HeritageOriginRecord, NationalizeCountry } from './types';
