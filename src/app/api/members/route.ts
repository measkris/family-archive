import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/server';
import { canEditTree, canViewTree } from '@/lib/auth/permissions';
import {
  DEFAULT_FAMILY_TREE_GROUP,
  DEFAULT_TREE_ID,
  type FamilyMemberRecord,
} from '@/lib/data/lang-genealogy';

export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const [user, trees, allMembers] = await Promise.all([
      getAuthenticatedUser(request),
      db.getFamilyTrees(),
      db.getAllMembers(),
    ]);

    const viewableTreeIds = new Set(
      trees.filter((t) => canViewTree(t, user)).map((t) => t.id)
    );
    const members = allMembers.filter((m) =>
      viewableTreeIds.has(m.treeId || DEFAULT_TREE_ID)
    );

    return NextResponse.json({
      provider: db.provider,
      count: members.length,
      members,
    });
  } catch (error) {
    console.error('GET /api/members error:', error);
    return NextResponse.json(
      { error: 'Failed to load family members from database' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Public visitors cannot edit family trees.' },
        { status: 401 }
      );
    }

    const body = (await request.json()) as Partial<FamilyMemberRecord>;
    if (!body.firstName || !body.lastName) {
      return NextResponse.json(
        { error: 'firstName and lastName are required' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const targetTreeId = body.treeId?.trim() || DEFAULT_TREE_ID;
    const trees = await db.getFamilyTrees();
    const targetTree =
      trees.find((t) => t.id === targetTreeId) ||
      (targetTreeId === DEFAULT_TREE_ID ? DEFAULT_FAMILY_TREE_GROUP : undefined);

    if (!targetTree) {
      return NextResponse.json({ error: 'Target family tree not found' }, { status: 404 });
    }
    if (!canEditTree(targetTree, user)) {
      return NextResponse.json(
        { error: 'You do not have permission to add members to this family tree.' },
        { status: 403 }
      );
    }

    const id =
      body.id?.trim() ||
      `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const fullName =
      body.fullName?.trim() || `${body.firstName.trim()} ${body.lastName.trim()}`;

    const member: FamilyMemberRecord = {
      id,
      treeId: targetTreeId,
      code: body.code?.trim() || `GEN-${body.generation ?? 4}`,
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      fullName,
      nickname: body.nickname?.trim() || undefined,
      gender: body.gender || 'unknown',
      generation: Number(body.generation) || 4,
      branch: body.branch || 'root',
      parentId: body.parentId ?? null,
      fatherName: body.fatherName?.trim() || undefined,
      motherName: body.motherName?.trim() || undefined,
      birthDate: body.birthDate?.trim() || undefined,
      birthYear: body.birthYear ? Number(body.birthYear) : undefined,
      birthPlace: body.birthPlace?.trim() || undefined,
      deathDate: body.deathDate?.trim() || undefined,
      deathYear: body.deathYear ? Number(body.deathYear) : undefined,
      deathPlace: body.deathPlace?.trim() || undefined,
      burialPlace: body.burialPlace?.trim() || undefined,
      occupation: body.occupation?.trim() || undefined,
      religion: body.religion?.trim() || undefined,
      heritageTags: Array.isArray(body.heritageTags) ? body.heritageTags : [],
      region: body.region?.trim() || body.birthPlace?.trim() || 'Manado, North Sulawesi, Indonesia',
      photoUrl: body.photoUrl?.trim() || undefined,
      bio: body.bio?.trim() || '',
      spouses: Array.isArray(body.spouses) ? body.spouses : [],
      sources: Array.isArray(body.sources) ? body.sources : ['User-contributed family record'],
      sourceUrl: body.sourceUrl?.trim() || 'https://www.brouwertree.com/langgene.html',
      isFeatured: Boolean(body.isFeatured),
    };

    const saved = await db.upsertMember(member);
    return NextResponse.json({ member: saved, provider: db.provider }, { status: 201 });
  } catch (error) {
    console.error('POST /api/members error:', error);
    return NextResponse.json({ error: 'Failed to save family member' }, { status: 500 });
  }
}
