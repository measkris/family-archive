import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, type HeritageOriginRecord } from '@/lib/db';

async function fetchNationalize(surname: string) {
  try {
    const res = await fetch(
      `https://api.nationalize.io/?name=${encodeURIComponent(surname)}`,
      {
        headers: { 'User-Agent': 'LangTampemawaFamilyArchive/1.0' },
        signal: AbortSignal.timeout(4500),
      }
    );
    if (!res.ok) return undefined;
    const json = await res.json();
    if (Array.isArray(json?.country)) {
      return json.country.slice(0, 4).map((c: { country_id: string; probability: number }) => ({
        country_id: String(c.country_id),
        probability: Number(c.probability),
      }));
    }
  } catch {
    return undefined;
  }
  return undefined;
}

async function fetchOpenArchivesCount(surname: string): Promise<number | undefined> {
  try {
    const res = await fetch(
      `https://api.openarch.nl/1.0/records/search.json?name=${encodeURIComponent(
        surname
      )}&number_show=1`,
      {
        headers: { 'User-Agent': 'LangTampemawaFamilyArchive/1.0' },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return undefined;
    const json = await res.json();
    const num = json?.response?.number_found;
    return typeof num === 'number' ? num : undefined;
  } catch {
    return undefined;
  }
}

async function fetchWikipediaSummary(slug: string) {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`,
      {
        headers: { 'User-Agent': 'LangTampemawaFamilyArchive/1.0' },
        signal: AbortSignal.timeout(4500),
      }
    );
    if (!res.ok) return undefined;
    const json = await res.json();
    return {
      summary: typeof json.extract === 'string' ? json.extract : undefined,
      url: json.content_urls?.desktop?.page as string | undefined,
      thumbnail: json.thumbnail?.source as string | undefined,
    };
  } catch {
    return undefined;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shouldEnrich = searchParams.get('enrich') === 'true';
  const forceRefresh = searchParams.get('refresh') === 'true';

  try {
    const db = getDatabase();
    const origins = await db.getHeritageOrigins();

    if (!shouldEnrich) {
      return NextResponse.json({
        provider: db.provider,
        origins,
        apis: ['Nationalize.io API', 'OpenArchives.nl API', 'Wikipedia REST API v1'],
      });
    }

    const enriched: HeritageOriginRecord[] = [];
    for (let i = 0; i < origins.length; i += 2) {
      const batch = origins.slice(i, i + 2);
      const batchResults = await Promise.all(
        batch.map(async (item) => {
          if (item.lastEnrichedAt && item.openArchivesCount !== undefined && !forceRefresh) {
            return item;
          }
          const [nat, oaCount, wiki] = await Promise.all([
            fetchNationalize(item.surname),
            fetchOpenArchivesCount(item.surname),
            fetchWikipediaSummary(item.wikipediaSlug),
          ]);

          const updated: HeritageOriginRecord = {
            ...item,
            nationalizeCountries: nat ?? item.nationalizeCountries,
            openArchivesCount: oaCount ?? item.openArchivesCount,
            wikipediaSummary: wiki?.summary ?? item.wikipediaSummary,
            wikipediaUrl: wiki?.url ?? item.wikipediaUrl,
            wikipediaThumbnail: wiki?.thumbnail ?? item.wikipediaThumbnail,
            lastEnrichedAt: new Date().toISOString(),
          };

          await db.updateHeritageOrigin(updated);
          return updated;
        })
      );
      enriched.push(...batchResults);
    }

    return NextResponse.json({
      provider: db.provider,
      origins: enriched,
      enriched: true,
      apis: ['Nationalize.io API', 'OpenArchives.nl API', 'Wikipedia REST API v1'],
    });
  } catch (error) {
    console.error('GET /api/heritage/origins error:', error);
    return NextResponse.json({ error: 'Failed to fetch heritage origins' }, { status: 500 });
  }
}
