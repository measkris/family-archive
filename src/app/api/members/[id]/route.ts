import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import type { FamilyMemberRecord } from '@/lib/data/lang-genealogy';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const db = getDatabase();
    const member = await db.getMemberById(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
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
    const db = getDatabase();
    const existing = await db.getMemberById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    const patch = (await request.json()) as Partial<FamilyMemberRecord>;
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
  _req: NextRequest,
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
    const db = getDatabase();
    const ok = await db.deleteMember(id);
    return NextResponse.json({ deleted: ok });
  } catch (error) {
    console.error('DELETE /api/members/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}
