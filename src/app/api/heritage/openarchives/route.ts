import { NextRequest, NextResponse } from 'next/server';

export interface OpenArchiveRecord {
  id: string;
  personName: string;
  eventType: string;
  eventDate: string;
  eventYear: number | null;
  eventPlace: string;
  archiveName: string;
  archiveCode: string;
  sourceType: string;
  relationType: string;
  recordUrl: string;
  hasScan: boolean;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || 'Jan Wolters Kuitert').trim();
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 40);

  try {
    const apiUrl = `https://api.openarch.nl/1.0/records/search.json?name=${encodeURIComponent(
      query
    )}&number_show=${limit}&lang=en`;

    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'LangTampemawaFamilyArchive/1.0',
        Accept: 'application/json',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          query,
          totalFound: 0,
          records: [],
          sourceApi: 'OpenArchives.nl API v1.0',
          warning: `OpenArchives returned HTTP ${res.status}`,
        },
        { status: 200 }
      );
    }

    const data = await res.json();
    const docs = Array.isArray(data?.response?.docs) ? data.response.docs : [];
    const totalFound = Number(data?.response?.number_found ?? docs.length);

    const records: OpenArchiveRecord[] = docs.map((d: Record<string, unknown>, idx: number) => {
      const evDate = d.eventdate as { year?: number; month?: number; day?: number } | undefined;
      const dateStr = evDate?.year
        ? [evDate.day, evDate.month, evDate.year].filter(Boolean).join('-')
        : 'Undated';

      return {
        id: String(d.identifier || d.pid || `oa-${idx}`),
        personName: String(d.personname || query),
        eventType: String(d.eventtype || 'Historical Record'),
        eventDate: dateStr,
        eventYear: evDate?.year ? Number(evDate.year) : null,
        eventPlace: String(d.eventplace || d.archive || 'Netherlands / N.O.I.'),
        archiveName: String(d.archive || d.sourcetype || 'Dutch Regional Archive'),
        archiveCode: String(d.archive_code || ''),
        sourceType: String(d.sourcetype || 'Civil Registry'),
        relationType: String(d.relationtype || 'Mentioned'),
        recordUrl: String(d.url || `https://www.openarchieven.nl/search.php?name=${encodeURIComponent(query)}`),
        hasScan: Boolean(d.scans && Number(d.scans) > 0),
      };
    });

    return NextResponse.json({
      query,
      totalFound,
      records,
      sourceApi: 'OpenArchives.nl REST API (api.openarch.nl/1.0)',
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('OpenArchives proxy error:', error);
    return NextResponse.json(
      {
        query,
        totalFound: 0,
        records: [],
        sourceApi: 'OpenArchives.nl REST API',
        error: 'Unable to reach OpenArchives.nl right now',
      },
      { status: 200 }
    );
  }
}
