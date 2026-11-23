import { NextRequest, NextResponse } from 'next/server';
import { searchDelpherPress } from '@/lib/heritage/delpher';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const surname = searchParams.get('surname') || '';
  const firstName = searchParams.get('firstName') || '';
  const place = searchParams.get('place') || '';
  const rawQuery = searchParams.get('q') || '';
  const limit = Number(searchParams.get('limit')) || 5;

  try {
    const result = await searchDelpherPress({
      surname,
      firstName,
      place,
      rawQuery: rawQuery || undefined,
      limit,
    });

    return NextResponse.json({
      ...result,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Delpher SRU API error:', error);
    return NextResponse.json(
      {
        query: rawQuery || surname,
        totalFound: 0,
        articles: [],
        sourceApi: 'Koninklijke Bibliotheek (KB) Delpher SRU v1.2',
        error: 'Unable to reach KB Delpher SRU right now',
      },
      { status: 200 }
    );
  }
}
