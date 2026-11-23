import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import {
  ARCHIVAL_RECORDS,
  DEFAULT_FAMILY_TREE_GROUP,
  DEFAULT_TREE_ID,
  HERITAGE_ORIGINS_SEED,
  INITIAL_MEMBERS,
  type ArchivalSourceRecord,
  type FamilyMemberRecord,
  type FamilyTreeGroupRecord,
} from "@/lib/data/lang-genealogy";
import { normalizePlaceName } from "@/lib/geo/locations";
import type { DatabaseAdapter, HeritageOriginRecord } from "./types";

let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let verifiedReady = false;
let seededPromise: Promise<void> | null = null;

// Prefix for fallback tree group storage inside archival_records if family_trees rules aren't open yet
const TREE_META_DOC_PREFIX = "__tree_group__";

const CACHE_TTL_MS = 60_000;
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
let membersCache: CacheEntry<FamilyMemberRecord[]> | null = null;
let archivesCache: CacheEntry<ArchivalSourceRecord[]> | null = null;
let originsCache: CacheEntry<HeritageOriginRecord[]> | null = null;
let treesCache: CacheEntry<FamilyTreeGroupRecord[]> | null = null;

let membersInFlight: Promise<FamilyMemberRecord[]> | null = null;
let archivesInFlight: Promise<ArchivalSourceRecord[]> | null = null;
let originsInFlight: Promise<HeritageOriginRecord[]> | null = null;
let treesInFlight: Promise<FamilyTreeGroupRecord[]> | null = null;

export function getFirebaseDatabaseId(): string {
  return process.env.FIREBASE_DATABASE_ID?.trim() || "(default)";
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_API_KEY && process.env.FIREBASE_PROJECT_ID,
  );
}

export class FirestoreSetupError extends Error {
  readonly code:
    | "NOT_CONFIGURED"
    | "DATABASE_NOT_FOUND"
    | "PERMISSION_DENIED"
    | "UNREACHABLE";
  readonly projectId: string;
  readonly databaseId: string;

  constructor(
    code: FirestoreSetupError["code"],
    message: string,
    projectId: string,
    databaseId: string,
  ) {
    super(message);
    this.name = "FirestoreSetupError";
    this.code = code;
    this.projectId = projectId;
    this.databaseId = databaseId;
  }
}

export async function assertFirestoreReady(): Promise<void> {
  if (verifiedReady) return;

  if (!isFirebaseConfigured()) {
    throw new FirestoreSetupError(
      "NOT_CONFIGURED",
      "Firebase environment variables are missing in .env.",
      "",
      "(default)",
    );
  }

  const projectId = process.env.FIREBASE_PROJECT_ID!.trim();
  const apiKey = process.env.FIREBASE_API_KEY!.trim();
  const databaseId = getFirebaseDatabaseId();

  let res: Response | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      res = await fetch(
        `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
          projectId,
        )}/databases/${encodeURIComponent(
          databaseId,
        )}/documents/family_members?pageSize=1&key=${encodeURIComponent(apiKey)}`,
        { signal: AbortSignal.timeout(5000) },
      );
      break;
    } catch (err) {
      if (attempt === 3) {
        throw new FirestoreSetupError(
          "UNREACHABLE",
          `Unable to reach Google Cloud Firestore: ${
            err instanceof Error ? err.message : "network error"
          }`,
          projectId,
          databaseId,
        );
      }
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }

  if (!res) {
    throw new FirestoreSetupError(
      "UNREACHABLE",
      "Unable to reach Firestore",
      projectId,
      databaseId,
    );
  }

  if (res.ok) {
    verifiedReady = true;
    return;
  }

  if (res.status === 404) {
    throw new FirestoreSetupError(
      "DATABASE_NOT_FOUND",
      `Firestore database "${databaseId}" does not exist yet in Firebase project "${projectId}".`,
      projectId,
      databaseId,
    );
  }

  if (res.status === 403) {
    throw new FirestoreSetupError(
      "PERMISSION_DENIED",
      `Firestore security rules denied access for project "${projectId}". Enable test mode or allow read/write rules in Firebase Console.`,
      projectId,
      databaseId,
    );
  }

  const body = await res.text();
  throw new FirestoreSetupError(
    "UNREACHABLE",
    `Firestore returned HTTP ${res.status}: ${body.slice(0, 180)}`,
    projectId,
    databaseId,
  );
}

function getDb(): Firestore {
  if (!firestoreInstance) {
    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    };
    appInstance =
      getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    const dbId = getFirebaseDatabaseId();
    firestoreInstance =
      dbId === "(default)"
        ? getFirestore(appInstance)
        : getFirestore(appInstance, dbId);
  }
  return firestoreInstance;
}

function normalizeMember(m: FamilyMemberRecord): FamilyMemberRecord {
  return {
    ...m,
    treeId: m.treeId || DEFAULT_TREE_ID,
    birthPlace: m.birthPlace ? normalizePlaceName(m.birthPlace) : m.birthPlace,
    deathPlace: m.deathPlace ? normalizePlaceName(m.deathPlace) : m.deathPlace,
    burialPlace: m.burialPlace ? normalizePlaceName(m.burialPlace) : m.burialPlace,
    region: normalizePlaceName(m.region) || m.region,
    bio: m.bio ? m.bio.replace(/\bMenado\b/g, "Manado") : m.bio,
    spouses: (m.spouses || []).map((s) => ({
      ...s,
      birthPlace: s.birthPlace ? normalizePlaceName(s.birthPlace) : s.birthPlace,
      deathPlace: s.deathPlace ? normalizePlaceName(s.deathPlace) : s.deathPlace,
      marriagePlace: s.marriagePlace
        ? normalizePlaceName(s.marriagePlace)
        : s.marriagePlace,
    })),
  };
}

function normalizeTree(t: FamilyTreeGroupRecord): FamilyTreeGroupRecord {
  return {
    ...t,
    subtitle: normalizePlaceName(t.subtitle) || t.subtitle,
    region: normalizePlaceName(t.region) || t.region,
    description: t.description
      ? t.description.replace(/\bMenado\b/g, "Manado")
      : t.description,
  };
}

function normalizeArchiveRecord(a: ArchivalSourceRecord): ArchivalSourceRecord {
  return {
    ...a,
    title: a.title.replace(/\bMenado\b/g, "Manado"),
    location: normalizePlaceName(a.location) || a.location,
    summary: a.summary.replace(/\bMenado\b/g, "Manado"),
  };
}

function normalizeOrigin(o: HeritageOriginRecord): HeritageOriginRecord {
  return {
    ...o,
    ancestralRegion: normalizePlaceName(o.ancestralRegion) || o.ancestralRegion,
    historicalContext: o.historicalContext
      ? o.historicalContext.replace(/\bMenado\b/g, "Manado")
      : o.historicalContext,
  };
}

function mergeArchivalRecords(
  records: ArchivalSourceRecord[],
): ArchivalSourceRecord[] {
  const byId = new Map<string, ArchivalSourceRecord>();
  for (const seed of ARCHIVAL_RECORDS) {
    byId.set(seed.id, normalizeArchiveRecord(seed));
  }
  for (const rec of records) {
    byId.set(rec.id, normalizeArchiveRecord(rec));
  }
  return Array.from(byId.values()).sort((a, b) => a.year - b.year);
}

function sortMembers(list: FamilyMemberRecord[]): FamilyMemberRecord[] {
  return list
    .map(normalizeMember)
    .sort(
      (a, b) =>
        a.generation - b.generation ||
        (a.birthYear ?? 9999) - (b.birthYear ?? 9999),
    );
}

function ensureDefaultTree(
  trees: FamilyTreeGroupRecord[],
): FamilyTreeGroupRecord[] {
  const byId = new Map<string, FamilyTreeGroupRecord>();
  byId.set(DEFAULT_TREE_ID, normalizeTree(DEFAULT_FAMILY_TREE_GROUP));
  for (const t of trees) {
    byId.set(t.id, normalizeTree(t));
  }
  return Array.from(byId.values()).sort((a, b) => {
    if (a.id === DEFAULT_TREE_ID) return -1;
    if (b.id === DEFAULT_TREE_ID) return 1;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export class FirebaseDatabaseAdapter implements DatabaseAdapter {
  readonly provider = "firebase-firestore" as const;
  readonly label = "Google Firebase Firestore";
  readonly description = "Connected directly to Google Cloud Firestore.";
  readonly location = `firestore://${process.env.FIREBASE_PROJECT_ID || "unconfigured"}/${getFirebaseDatabaseId()}`;
  readonly isCloud = true;

  async ensureSeeded(): Promise<void> {
    await assertFirestoreReady();
    if (!seededPromise) {
      seededPromise = this._seedAndPrimeCache().catch((err) => {
        seededPromise = null;
        throw err;
      });
    }
    return seededPromise;
  }

  private async _seedAndPrimeCache(): Promise<void> {
    const db = getDb();
    const [membersSnap, arcSnap, herSnap] = await Promise.all([
      getDocs(collection(db, "family_members")),
      getDocs(collection(db, "archival_records")),
      getDocs(collection(db, "heritage_origins")),
    ]);

    const batch = writeBatch(db);
    let ops = 0;

    let members: FamilyMemberRecord[];
    if (membersSnap.empty) {
      members = INITIAL_MEMBERS.map(
        (m) => JSON.parse(JSON.stringify(normalizeMember(m))) as FamilyMemberRecord,
      );
      for (const m of members) {
        batch.set(doc(db, "family_members", m.id), m);
        ops++;
      }
    } else {
      const existing = membersSnap.docs.map(
        (d) => d.data() as FamilyMemberRecord,
      );
      const existingIds = new Set(existing.map((m) => m.id));
      // One-time upgrade: if Firestore only has Gen I–IV seed records for the default tree,
      // add the newly verified Gen IV–VIII lineage members without overwriting any existing docs.
      const hasExpandedGenerations = existing.some(
        (m) => (m.treeId || DEFAULT_TREE_ID) === DEFAULT_TREE_ID && m.generation >= 5,
      );
      if (!hasExpandedGenerations) {
        for (const seed of INITIAL_MEMBERS) {
          if (!existingIds.has(seed.id)) {
            const normalized = JSON.parse(
              JSON.stringify(normalizeMember(seed)),
            ) as FamilyMemberRecord;
            batch.set(doc(db, "family_members", normalized.id), normalized);
            existing.push(normalized);
            ops++;
          }
        }
      }
      members = sortMembers(existing);
    }

    // Separate real archival_records from any fallback tree group metadata docs
    const allArcDocs = arcSnap.docs.map((d) => ({
      docId: d.id,
      data: d.data() as Record<string, unknown>,
    }));
    const realArcDocs = allArcDocs.filter(
      (d) =>
        !d.docId.startsWith(TREE_META_DOC_PREFIX) &&
        d.data.__recordType !== "family_tree_group",
    );
    const fallbackTreeDocs = allArcDocs
      .filter(
        (d) =>
          d.docId.startsWith(TREE_META_DOC_PREFIX) ||
          d.data.__recordType === "family_tree_group",
      )
      .map((d) => d.data as unknown as FamilyTreeGroupRecord);

    let archives: ArchivalSourceRecord[];
    if (realArcDocs.length === 0) {
      archives = ARCHIVAL_RECORDS.map((a) =>
        normalizeArchiveRecord(JSON.parse(JSON.stringify(a))),
      );
      for (const a of archives) {
        batch.set(doc(db, "archival_records", a.id), a);
        ops++;
      }
    } else {
      archives = mergeArchivalRecords(
        realArcDocs.map((d) => d.data as unknown as ArchivalSourceRecord),
      );
    }

    let origins: HeritageOriginRecord[];
    if (herSnap.empty) {
      origins = HERITAGE_ORIGINS_SEED.map((h) => JSON.parse(JSON.stringify(h)));
      for (const h of origins) {
        batch.set(doc(db, "heritage_origins", h.id), h);
        ops++;
      }
    } else {
      origins = herSnap.docs
        .map((d) => d.data() as HeritageOriginRecord)
        .sort((a, b) => a.firstAppearanceYear - b.firstAppearanceYear);
    }

    if (ops > 0) {
      await batch.commit();
    }

    // Try reading dedicated family_trees collection; merge with any fallback tree docs
    let dedicatedTrees: FamilyTreeGroupRecord[] = [];
    try {
      const treesSnap = await getDocs(collection(db, "family_trees"));
      dedicatedTrees = treesSnap.docs.map(
        (d) => d.data() as FamilyTreeGroupRecord,
      );
    } catch {
      // Rules may only allow family_members / archival_records / heritage_origins
    }

    const expiresAt = Date.now() + CACHE_TTL_MS;
    membersCache = { data: members, expiresAt };
    archivesCache = { data: archives, expiresAt };
    originsCache = { data: origins, expiresAt };
    treesCache = {
      data: ensureDefaultTree([...fallbackTreeDocs, ...dedicatedTrees]),
      expiresAt,
    };
  }

  async getAllMembers(): Promise<FamilyMemberRecord[]> {
    await this.ensureSeeded();
    if (membersCache && Date.now() < membersCache.expiresAt) {
      return membersCache.data;
    }
    if (!membersInFlight) {
      membersInFlight = getDocs(collection(getDb(), "family_members"))
        .then((snap) => {
          const data = sortMembers(
            snap.docs.map((d) => d.data() as FamilyMemberRecord),
          );
          membersCache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
          return data;
        })
        .finally(() => {
          membersInFlight = null;
        });
    }
    return membersInFlight;
  }

  async getMemberById(id: string): Promise<FamilyMemberRecord | null> {
    await this.ensureSeeded();
    if (membersCache && Date.now() < membersCache.expiresAt) {
      const cached = membersCache.data.find((m) => m.id === id);
      if (cached) return cached;
    }
    const snap = await getDoc(doc(getDb(), "family_members", id));
    return snap.exists()
      ? normalizeMember(snap.data() as FamilyMemberRecord)
      : null;
  }

  async upsertMember(member: FamilyMemberRecord): Promise<FamilyMemberRecord> {
    await this.ensureSeeded();
    const clean = normalizeMember(
      JSON.parse(JSON.stringify(member)) as FamilyMemberRecord,
    );
    await setDoc(doc(getDb(), "family_members", clean.id), clean);
    if (membersCache) {
      const exists = membersCache.data.some((m) => m.id === clean.id);
      const next = exists
        ? membersCache.data.map((m) => (m.id === clean.id ? clean : m))
        : [...membersCache.data, clean];
      membersCache = {
        data: sortMembers(next),
        expiresAt: Date.now() + CACHE_TTL_MS,
      };
    }
    return clean;
  }

  async deleteMember(id: string): Promise<boolean> {
    await this.ensureSeeded();
    await deleteDoc(doc(getDb(), "family_members", id));
    if (membersCache) {
      membersCache = {
        data: membersCache.data.filter((m) => m.id !== id),
        expiresAt: Date.now() + CACHE_TTL_MS,
      };
    }
    return true;
  }

  async getFamilyTrees(): Promise<FamilyTreeGroupRecord[]> {
    await this.ensureSeeded();
    if (treesCache && Date.now() < treesCache.expiresAt) {
      return treesCache.data;
    }
    if (!treesInFlight) {
      treesInFlight = (async () => {
        const db = getDb();
        let dedicatedTrees: FamilyTreeGroupRecord[] = [];
        try {
          const treesSnap = await getDocs(collection(db, "family_trees"));
          dedicatedTrees = treesSnap.docs.map(
            (d) => d.data() as FamilyTreeGroupRecord,
          );
        } catch {
          // fallback below
        }

        const arcSnap = await getDocs(collection(db, "archival_records"));
        const fallbackTrees = arcSnap.docs
          .filter(
            (d) =>
              d.id.startsWith(TREE_META_DOC_PREFIX) ||
              (d.data() as Record<string, unknown>).__recordType ===
                "family_tree_group",
          )
          .map((d) => d.data() as unknown as FamilyTreeGroupRecord);

        const data = ensureDefaultTree([...fallbackTrees, ...dedicatedTrees]);
        treesCache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
        return data;
      })().finally(() => {
        treesInFlight = null;
      });
    }
    return treesInFlight;
  }

  async upsertFamilyTree(
    tree: FamilyTreeGroupRecord,
  ): Promise<FamilyTreeGroupRecord> {
    await this.ensureSeeded();
    const clean = JSON.parse(JSON.stringify(tree)) as FamilyTreeGroupRecord;
    const db = getDb();

    // Try dedicated family_trees collection first; if rules deny it, store cleanly in archival_records
    try {
      await setDoc(doc(db, "family_trees", clean.id), clean);
    } catch {
      await setDoc(
        doc(db, "archival_records", `${TREE_META_DOC_PREFIX}${clean.id}`),
        {
          ...clean,
          __recordType: "family_tree_group",
        },
      );
    }

    if (treesCache) {
      const next = ensureDefaultTree([
        ...treesCache.data.filter((t) => t.id !== clean.id),
        clean,
      ]);
      treesCache = { data: next, expiresAt: Date.now() + CACHE_TTL_MS };
    }
    return clean;
  }

  async getArchivalRecords(): Promise<ArchivalSourceRecord[]> {
    await this.ensureSeeded();
    if (archivesCache && Date.now() < archivesCache.expiresAt) {
      return archivesCache.data;
    }
    if (!archivesInFlight) {
      archivesInFlight = getDocs(collection(getDb(), "archival_records"))
        .then((snap) => {
          const raw = snap.docs
            .filter(
              (d) =>
                !d.id.startsWith(TREE_META_DOC_PREFIX) &&
                (d.data() as Record<string, unknown>).__recordType !==
                  "family_tree_group",
            )
            .map((d) => d.data() as ArchivalSourceRecord);
          const data = mergeArchivalRecords(raw);
          archivesCache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
          return data;
        })
        .finally(() => {
          archivesInFlight = null;
        });
    }
    return archivesInFlight;
  }

  async getHeritageOrigins(): Promise<HeritageOriginRecord[]> {
    await this.ensureSeeded();
    if (originsCache && Date.now() < originsCache.expiresAt) {
      return originsCache.data;
    }
    if (!originsInFlight) {
      originsInFlight = getDocs(collection(getDb(), "heritage_origins"))
        .then((snap) => {
          const data = snap.docs
            .map((d) => normalizeOrigin(d.data() as HeritageOriginRecord))
            .sort((a, b) => a.firstAppearanceYear - b.firstAppearanceYear);
          originsCache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
          return data;
        })
        .finally(() => {
          originsInFlight = null;
        });
    }
    return originsInFlight;
  }

  async updateHeritageOrigin(origin: HeritageOriginRecord): Promise<void> {
    await this.ensureSeeded();
    const clean = JSON.parse(JSON.stringify(origin)) as HeritageOriginRecord;
    await setDoc(doc(getDb(), "heritage_origins", clean.id), clean, {
      merge: true,
    });
    if (originsCache) {
      originsCache = {
        data: originsCache.data.map((o) =>
          o.id === clean.id ? { ...o, ...clean } : o,
        ),
        expiresAt: Date.now() + CACHE_TTL_MS,
      };
    }
  }
}
