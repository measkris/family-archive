import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/server';
import { canEditTree, normalizeEmail } from '@/lib/auth/permissions';
import { finalizeDraftsForTree, type ParsedMemberDraft } from '@/lib/import/tree-parser';
import type { FamilyTreeGroupRecord } from '@/lib/data/lang-genealogy';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in to bulk import family tree data.' },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      mode: 'existing' | 'new';
      treeId?: string;
      newTree?: {
        name: string;
        subtitle?: string;
        region?: string;
        sourceUrl?: string;
        accentColor?: FamilyTreeGroupRecord['accentColor'];
        visibility?: 'public' | 'private';
      };
      drafts: ParsedMemberDraft[];
    };

    if (!Array.isArray(body.drafts) || body.drafts.length === 0) {
      return NextResponse.json(
        { error: 'No parsed members provided to import' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    let targetTree: FamilyTreeGroupRecord | undefined;

    if (body.mode === 'new') {
      const name = body.newTree?.name?.trim();
      if (!name) {
        return NextResponse.json(
          { error: 'New family tree group name is required' },
          { status: 400 }
        );
      }
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 32);
      const id = `${slug || 'tree'}-${Date.now().toString(36).slice(-4)}`;

      targetTree = await db.upsertFamilyTree({
        id,
        name,
        subtitle: body.newTree?.subtitle?.trim() || 'Bulk Imported Family Collection',
        region: body.newTree?.region?.trim() || 'Archival Lineage',
        sourceLabel: body.newTree?.sourceUrl
          ? body.newTree.sourceUrl.replace(/^https?:\/\/(www\.)?/i, '').slice(0, 42)
          : undefined,
        sourceUrl: body.newTree?.sourceUrl?.trim() || undefined,
        accentColor: body.newTree?.accentColor || 'emerald',
        createdAt: new Date().toISOString(),
        ownerId: user.uid,
        ownerEmail: normalizeEmail(user.email),
        visibility: body.newTree?.visibility === 'private' ? 'private' : 'public',
        collaborators: [],
      });
    } else {
      const trees = await db.getFamilyTrees();
      targetTree = trees.find((t) => t.id === body.treeId) || trees[0];
      if (targetTree && !canEditTree(targetTree, user)) {
        return NextResponse.json(
          { error: 'You do not have permission to import into this family tree.' },
          { status: 403 }
        );
      }
    }

    if (!targetTree) {
      return NextResponse.json({ error: 'Target family tree not found' }, { status: 404 });
    }

    const allExisting = await db.getAllMembers();
    const existingInTree = allExisting.filter(
      (m) => (m.treeId || 'lang-tampemawa') === targetTree.id
    );

    const finalized = finalizeDraftsForTree(body.drafts, targetTree.id, existingInTree);

    // Persist all imported members to Firestore
    const saved = [];
    for (const m of finalized) {
      saved.push(await db.upsertMember(m));
    }

    return NextResponse.json(
      {
        tree: targetTree,
        members: saved,
        importedCount: saved.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/trees/bulk-import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Bulk import failed' },
      { status: 500 }
    );
  }
}
