import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/server';
import { canEditTree, canViewTree } from '@/lib/auth/permissions';
import {
  DEFAULT_FAMILY_TREE_GROUP,
  DEFAULT_TREE_ID,
  type FamilyMemberRecord,
} from '@/lib/data/lang-genealogy';

async function resolveMemberTree(treeId?: string) {
  const db = getDatabase();
  const id = treeId || DEFAULT_TREE_ID;
  const trees = await db.getFamilyTrees();
  return (
    trees.find((t) => t.id === id) ||
    (id === DEFAULT_TREE_ID ? DEFAULT_FAMILY_TREE_GROUP : undefined)
  );
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const db = getDatabase();
    const [user, member] = await Promise.all([
      getAuthenticatedUser(request),
      db.getMemberById(id),
    ]);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    const tree = await resolveMemberTree(member.treeId);
    if (tree && !canViewTree(tree, user)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    return NextResponse.json({ member });
  } catch (error) {
    console.error('GET /api/members/[id] error:', error);
    return NextResponse.json({ error: 'Database read failed' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Public visitors cannot edit records.' },
        { status: 401 }
      );
    }

    const db = getDatabase();
    const existing = await db.getMemberById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const sourceTree = await resolveMemberTree(existing.treeId);
    if (!sourceTree || !canEditTree(sourceTree, user)) {
      return NextResponse.json(
        { error: 'You do not have permission to edit members in this tree.' },
        { status: 403 }
      );
    }

    const patch = (await request.json()) as Partial<FamilyMemberRecord>;
    if (patch.treeId && patch.treeId !== existing.treeId) {
      const targetTree = await resolveMemberTree(patch.treeId);
      if (!targetTree || !canEditTree(targetTree, user)) {
        return NextResponse.json(
          { error: 'You do not have permission to move members into the target tree.' },
          { status: 403 }
        );
      }
    }

    const updated: FamilyMemberRecord = {
      ...existing,
      ...patch,
      id: existing.id,
      fullName:
        patch.fullName?.trim() ||
        `${(patch.firstName ?? existing.firstName).trim()} ${(patch.lastName ?? existing.lastName).trim()}`,
    };
    const saved = await db.upsertMember(updated);
    return NextResponse.json({ member: saved });
  } catch (error) {
    console.error('PATCH /api/members/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (id === 'I') {
    return NextResponse.json(
      { error: 'Cannot delete founding root ancestor Jacob Lang (I)' },
      { status: 400 }
    );
  }
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Public visitors cannot delete records.' },
        { status: 401 }
      );
    }

    const db = getDatabase();
    const existing = await db.getMemberById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    const sourceTree = await resolveMemberTree(existing.treeId);
    if (!sourceTree || !canEditTree(sourceTree, user)) {
      return NextResponse.json(
        { error: 'You do not have permission to delete members from this tree.' },
        { status: 403 }
      );
    }

    const ok = await db.deleteMember(id);
    return NextResponse.json({ deleted: ok });
  } catch (error) {
    console.error('DELETE /api/members/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}
