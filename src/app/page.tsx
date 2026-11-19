import React, { Suspense } from "react";
import { FirestoreSetupError, getDatabase } from "@/lib/db";
import { getAuthenticatedUser, getPublicFirebaseWebConfig } from "@/lib/auth/server";
import { canViewTree } from "@/lib/auth/permissions";
import type { AuthUser, PublicFirebaseConfig } from "@/lib/auth/types";
import { FamilyTreeWorkspace } from "@/components/FamilyTreeWorkspace";
import { WorkspaceSkeleton } from "@/components/WorkspaceSkeleton";
import {
  DEFAULT_TREE_ID,
  type ArchivalSourceRecord,
  type FamilyMemberRecord,
  type FamilyTreeGroupRecord,
} from "@/lib/data/lang-genealogy";
import type { HeritageOriginRecord } from "@/lib/db/types";

export const dynamic = "force-dynamic";

async function loadArchiveData(): Promise<
  | {
      ok: true;
      user: AuthUser | null;
      firebaseConfig: PublicFirebaseConfig | null;
      members: FamilyMemberRecord[];
      familyTrees: FamilyTreeGroupRecord[];
      archivalRecords: ArchivalSourceRecord[];
      heritageOrigins: HeritageOriginRecord[];
    }
  | {
      ok: false;
      projectId: string;
      message: string;
    }
> {
  const db = getDatabase();
  try {
    await db.ensureSeeded();
    const [user, allMembers, allFamilyTrees, archivalRecords, heritageOrigins] =
      await Promise.all([
        getAuthenticatedUser(),
        db.getAllMembers(),
        db.getFamilyTrees(),
        db.getArchivalRecords(),
        db.getHeritageOrigins(),
      ]);

    const familyTrees = allFamilyTrees.filter((t) => canViewTree(t, user));
    const viewableTreeIds = new Set(familyTrees.map((t) => t.id));
    const members = allMembers.filter((m) =>
      viewableTreeIds.has(m.treeId || DEFAULT_TREE_ID)
    );

    return {
      ok: true,
      user,
      firebaseConfig: getPublicFirebaseWebConfig(),
      members,
      familyTrees,
      archivalRecords,
      heritageOrigins,
    };
  } catch (err) {
    const isSetupErr = err instanceof FirestoreSetupError;
    const projectId = isSetupErr
      ? err.projectId
      : process.env.FIREBASE_PROJECT_ID || "";
    const message =
      err instanceof Error
        ? err.message
        : "Unable to connect to Google Cloud Firestore.";
    return { ok: false, projectId, message };
  }
}

async function FamilyArchiveLoader() {
  const result = await loadArchiveData();

  if (!result.ok) {
    return (
      <main className="min-h-screen bg-[#f6f4ef] flex items-center justify-center p-6 animate-fade-in">
        <div className="max-w-xl w-full rounded-xl border border-stone-300 bg-white p-7 shadow-lg space-y-4">
          <div className="inline-flex items-center rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-900">
            Firestore Database Action Required
          </div>
          <h1 className="font-heritage text-3xl font-bold text-stone-900">
            Finish Creating Firestore for{" "}
            <span className="font-mono text-2xl text-[#0b4a68]">
              {result.projectId || "Firebase"}
            </span>
          </h1>
          <p className="text-sm text-stone-700 leading-relaxed">
            {result.message}
          </p>

          <ol className="list-decimal pl-5 space-y-2 text-sm text-stone-700">
            <li>
              Open{" "}
              <a
                href={`https://console.firebase.google.com/project/${result.projectId}/firestore`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#0b4a68] underline"
              >
                Firebase Console → Firestore Database
              </a>{" "}
              and ensure database <code>(default)</code> and read/write rules
              are published.
            </li>
            <li>
              Reload this page — all family data will load directly from
              Firestore.
            </li>
          </ol>
        </div>
      </main>
    );
  }

  return (
    <FamilyTreeWorkspace
      initialUser={result.user}
      firebaseConfig={result.firebaseConfig}
      initialMembers={result.members}
      initialFamilyTrees={result.familyTrees}
      initialArchivalRecords={result.archivalRecords}
      initialHeritageOrigins={result.heritageOrigins}
    />
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<WorkspaceSkeleton />}>
      <FamilyArchiveLoader />
    </Suspense>
  );
}
