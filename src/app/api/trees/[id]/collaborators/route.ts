import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/server';
import { canManageTreeSettings, normalizeEmail } from '@/lib/auth/permissions';
import type { FamilyTreeGroupRecord, TreeCollaborator } from '@/lib/data/lang-genealogy';

export async function POST(
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
        { error: 'Only the tree owner or Super Admin can invite collaborators.' },
        { status: 403 }
      );
    }

    const body = (await request.json()) as { email?: string };
    const email = normalizeEmail(body.email);
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid collaborator email is required' }, { status: 400 });
    }
    if (existing.ownerEmail && normalizeEmail(existing.ownerEmail) === email) {
      return NextResponse.json(
        { error: 'The tree owner already has full edit access.' },
        { status: 400 }
      );
    }

    const current = existing.collaborators || [];
    if (current.some((c) => normalizeEmail(c.email) === email)) {
      return NextResponse.json(
        { error: 'This user has already been invited as a collaborator.' },
        { status: 409 }
      );
    }

    const entry: TreeCollaborator = {
      email,
      role: 'editor',
      invitedAt: new Date().toISOString(),
      invitedBy: normalizeEmail(user.email),
    };

    const updated: FamilyTreeGroupRecord = {
      ...existing,
      collaborators: [...current, entry],
    };

    const saved = await db.upsertFamilyTree(updated);
    return NextResponse.json({ tree: saved }, { status: 201 });
  } catch (error) {
    console.error('POST /api/trees/[id]/collaborators error:', error);
    return NextResponse.json({ error: 'Failed to invite collaborator' }, { status: 500 });
  }
}

export async function DELETE(
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
        { error: 'Only the tree owner or Super Admin can remove collaborators.' },
        { status: 403 }
      );
    }

    const queryEmail = normalizeEmail(request.nextUrl.searchParams.get('email'));
    if (!queryEmail) {
      return NextResponse.json({ error: 'Collaborator email is required' }, { status: 400 });
    }

    const updated: FamilyTreeGroupRecord = {
      ...existing,
      collaborators: (existing.collaborators || []).filter(
        (c) => normalizeEmail(c.email) !== queryEmail
      ),
    };

    const saved = await db.upsertFamilyTree(updated);
    return NextResponse.json({ tree: saved });
  } catch (error) {
    console.error('DELETE /api/trees/[id]/collaborators error:', error);
    return NextResponse.json({ error: 'Failed to remove collaborator' }, { status: 500 });
  }
}
