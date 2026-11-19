import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import type { FamilyMemberRecord, FamilyTreeGroupRecord } from '@/lib/data/lang-genealogy';

export async function GET() {
  try {
    const db = getDatabase();
    const trees = await db.getFamilyTrees();
    return NextResponse.json({ trees, count: trees.length });
  } catch (error) {
    console.error('GET /api/trees error:', error);
    return NextResponse.json({ error: 'Failed to load family tree groups' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      subtitle?: string;
      region?: string;
      description?: string;
      sourceLabel?: string;
      sourceUrl?: string;
      accentColor?: FamilyTreeGroupRecord['accentColor'];
      founder?: {
        firstName?: string;
        lastName?: string;
        gender?: 'male' | 'female' | 'unknown';
        birthYear?: number;
        birthPlace?: string;
        spouseName?: string;
        photoUrl?: string;
      };
    };

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: 'Family tree name is required' }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 32);
    const id = `${slug || 'tree'}-${Date.now().toString(36).slice(-4)}`;

    const db = getDatabase();
    const tree: FamilyTreeGroupRecord = {
      id,
      name,
      subtitle: body.subtitle?.trim() || 'Family Lineage Collection',
      region: body.region?.trim() || 'Archival Lineage',
      description: body.description?.trim() || '',
      sourceLabel: body.sourceLabel?.trim() || undefined,
      sourceUrl: body.sourceUrl?.trim() || undefined,
      accentColor: body.accentColor || 'emerald',
      createdAt: new Date().toISOString(),
    };

    const savedTree = await db.upsertFamilyTree(tree);

    let founderMember: FamilyMemberRecord | null = null;
    if (body.founder?.firstName?.trim() && body.founder?.lastName?.trim()) {
      const f = body.founder;
      const spouseName = f.spouseName?.trim();
      const spouseParts = spouseName ? spouseName.split(/\s+/) : [];
      const member: FamilyMemberRecord = {
        id: `${id}-root`,
        treeId: id,
        code: 'I',
        firstName: f.firstName!.trim(),
        lastName: f.lastName!.trim(),
        fullName: `${f.firstName!.trim()} ${f.lastName!.trim()}`,
        gender: f.gender || 'male',
        generation: 1,
        branch: 'root',
        parentId: null,
        birthYear: f.birthYear ? Number(f.birthYear) : undefined,
        birthDate: f.birthYear ? String(f.birthYear) : undefined,
        birthPlace: f.birthPlace?.trim() || tree.region,
        heritageTags: [tree.region],
        region: f.birthPlace?.trim() || tree.region,
        photoUrl: f.photoUrl?.trim() || undefined,
        bio:
          tree.description ||
          `Founding ancestor of the ${tree.name} family tree collection.`,
        spouses: spouseName
          ? [
              {
                id: `sp-${id}-1`,
                name: spouseName,
                surname: spouseParts[spouseParts.length - 1] || spouseName,
                marriageOrder: 1,
              },
            ]
          : [],
        sources: ['Created in Family Archive'],
        sourceUrl: tree.sourceUrl || '',
        isFeatured: true,
      };
      founderMember = await db.upsertMember(member);
    }

    return NextResponse.json(
      { tree: savedTree, founderMember },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/trees error:', error);
    return NextResponse.json({ error: 'Failed to create family tree group' }, { status: 500 });
  }
}
