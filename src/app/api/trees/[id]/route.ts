import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/server';
import { canManageTreeSettings } from '@/lib/auth/permissions';
import type { FamilyTreeGroupRecord } from '@/lib/data/lang-genealogy';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const db = getDatabase();
    const trees = await db.getFamilyTrees();
    const existing = trees.find((t) => t.id === id);
    if (!existing) {
      return NextResponse.json({ error: 'Family tree not found' }, { status: 404 });
    }

    if (!canManageTreeSettings(existing, user)) {
      return NextResponse.json(
        { error: 'Only the tree owner or Super Admin can change tree settings.' },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      visibility?: 'public' | 'private';
      name?: string;
      subtitle?: string;
      region?: string;
      description?: string;
      accentColor?: FamilyTreeGroupRecord['accentColor'];
    };

    const updated: FamilyTreeGroupRecord = {
      ...existing,
      name: body.name?.trim() || existing.name,
      subtitle: body.subtitle !== undefined ? body.subtitle.trim() : existing.subtitle,
      region: body.region?.trim() || existing.region,
      description: body.description !== undefined ? body.description.trim() : existing.description,
      accentColor: body.accentColor || existing.accentColor,
      visibility:
        body.visibility === 'private' || body.visibility === 'public'
          ? body.visibility
          : existing.visibility || 'public',
    };

    const saved = await db.upsertFamilyTree(updated);
    return NextResponse.json({ tree: saved });
  } catch (error) {
    console.error('PATCH /api/trees/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update family tree' }, { status: 500 });
  }
}
