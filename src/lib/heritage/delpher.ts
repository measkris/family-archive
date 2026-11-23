export interface DelpherArticle {
  id: string;
  title: string;
  date: string;
  year: number | null;
  newspaper: string;
  archiveSource: string;
  excerpt: string;
  citation: string;
  urn: string;
}

export interface DelpherSearchResult {
  query: string;
  totalFound: number;
  articles: DelpherArticle[];
  sourceApi: string;
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTag(block: string, tagName: string): string {
  const re = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const m = block.match(re);
  return m ? decodeXmlEntities(m[1]) : '';
}

function formatIsoDate(raw: string): { date: string; year: number | null } {
  const m = raw.match(/(\d{4})[\/-](\d{2})[\/-](\d{2})/);
  if (!m) {
    const ym = raw.match(/(\d{4})/);
    return { date: ym ? ym[1] : 'Undated', year: ym ? Number(ym[1]) : null };
  }
  const year = Number(m[1]);
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const monthIdx = Math.max(0, Math.min(11, Number(m[2]) - 1));
  const day = Number(m[3]);
  return { date: `${day} ${monthNames[monthIdx]} ${year}`, year };
}

function buildSmartExcerpt(ocrXml: string, focusTerms: string[]): string {
  const paragraphs = [...ocrXml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => decodeXmlEntities(m[1].replace(/<[^>]+>/g, ' ')))
    .filter((p) => p.length > 20);

  const fullText =
    paragraphs.length > 0
      ? paragraphs.join(' ')
      : decodeXmlEntities(ocrXml.replace(/<[^>]+>/g, ' '));

  if (!fullText) return '';

  const lower = fullText.toLowerCase();
  let bestIdx = -1;

  for (const term of focusTerms) {
    const clean = term.trim().toLowerCase();
    if (clean.length < 3) continue;
    const idx = lower.indexOf(clean);
    if (idx !== -1) {
      bestIdx = idx;
      break;
    }
  }

  if (bestIdx === -1) {
    return fullText.length > 320 ? `${fullText.slice(0, 320).trim()}…` : fullText;
  }

  const start = Math.max(0, bestIdx - 90);
  const end = Math.min(fullText.length, bestIdx + 240);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < fullText.length ? '…' : '';
  return `${prefix}${fullText.slice(start, end).trim()}${suffix}`;
}

async function fetchOcrSnippet(ocrUrl: string, focusTerms: string[]): Promise<string> {
  if (!ocrUrl) return '';
  try {
    const res = await fetch(ocrUrl, {
      headers: { 'User-Agent': 'LangTampemawaFamilyArchive/1.0' },
      signal: AbortSignal.timeout(4500),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return '';
    const xml = await res.text();
    return buildSmartExcerpt(xml, focusTerms);
  } catch {
    return '';
  }
}

async function runKbSru(cqlQuery: string, limit: number): Promise<{ total: number; recordsXml: string[] }> {
  const url = `https://jsru.kb.nl/sru/sru?x-collection=DDD_artikel&operation=searchRetrieve&version=1.2&maximumRecords=${limit}&query=${encodeURIComponent(
    cqlQuery
  )}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'LangTampemawaFamilyArchive/1.0' },
    signal: AbortSignal.timeout(6500),
    next: { revalidate: 3600 },
  });

  if (!res.ok) return { total: 0, recordsXml: [] };
  const xml = await res.text();
  const totalMatch = xml.match(/<srw:numberOfRecords>(\d+)<\/srw:numberOfRecords>/);
  const total = totalMatch ? Number(totalMatch[1]) : 0;
  const recordsXml = [...xml.matchAll(/<srw:record>([\s\S]*?)<\/srw:record>/g)].map((m) => m[1]);
  return { total, recordsXml };
}

/**
 * Queries Koninklijke Bibliotheek (KB) Delpher SRU API for digitized Dutch & Dutch East Indies
 * historical newspapers and extracts readable OCR excerpts for in-app storytelling.
 */
export async function searchDelpherPress(options: {
  surname?: string;
  firstName?: string;
  place?: string;
  rawQuery?: string;
  limit?: number;
}): Promise<DelpherSearchResult> {
  const limit = Math.min(Math.max(options.limit ?? 4, 1), 8);
  const surname = (options.surname || '').replace(/["()]/g, '').trim();
  const firstName = (options.firstName || '').replace(/["()]/g, '').trim();
  const placeRaw = (options.place || '').toLowerCase();

  // Map modern place names to 19th/20th-century colonial newspaper spellings
  const placeTokens: string[] = [];
  if (placeRaw.includes('tombariri')) placeTokens.push('Tombariri');
  if (placeRaw.includes('tondano')) placeTokens.push('Tondano');
  if (placeRaw.includes('kema')) placeTokens.push('Kema');
  if (placeRaw.includes('manado') || placeRaw.includes('menado') || placeRaw.includes('minahasa')) {
    placeTokens.push('Menado', 'Minahassa');
  }
  if (placeRaw.includes('malang')) placeTokens.push('Malang');
  if (placeRaw.includes('blitar')) placeTokens.push('Blitar');
  if (placeRaw.includes('surabaya') || placeRaw.includes('soerabaja')) placeTokens.push('Soerabaja');
  if (placeRaw.includes('bandung') || placeRaw.includes('bandoeng')) placeTokens.push('Bandoeng');
  if (placeRaw.includes('batavia') || placeRaw.includes('jakarta')) placeTokens.push('Batavia');
  if (placeTokens.length === 0) {
    placeTokens.push('Menado', 'Minahassa', 'Celebes');
  }

  const placeClause = `(${placeTokens.slice(0, 3).join(' OR ')})`;

  const candidateQueries: string[] = [];
  if (options.rawQuery && options.rawQuery.trim()) {
    candidateQueries.push(options.rawQuery.trim());
  } else if (surname) {
    const initial = firstName ? `${firstName[0]}.` : '';
    // For common Dutch word "Lang" ("long"), require initials or specific colonial context to keep results relevant
    if (surname.toLowerCase() === 'lang') {
      if (initial) {
        candidateQueries.push(`"${initial} Lang" AND ${placeClause}`);
      }
      candidateQueries.push(`"familie Lang" AND ${placeClause}`);
      candidateQueries.push(`"J. Lang" AND Menado`);
    } else {
      if (firstName && initial) {
        candidateQueries.push(`"${surname}" AND ${placeClause}`);
      }
      candidateQueries.push(`"${surname}" AND (Menado OR Minahassa OR Celebes OR Batavia)`);
    }
  } else {
    candidateQueries.push(`"Menado" AND "Minahassa"`);
  }

  let usedQuery = candidateQueries[0];
  let total = 0;
  let recordsXml: string[] = [];

  for (const q of candidateQueries) {
    try {
      const attempt = await runKbSru(q, limit);
      if (attempt.recordsXml.length > 0) {
        usedQuery = q;
        total = attempt.total;
        recordsXml = attempt.recordsXml;
        break;
      }
    } catch {
      // Try next fallback query
    }
  }

  const focusTerms = [
    surname && firstName ? `${firstName[0]}. ${surname}` : '',
    surname,
    ...placeTokens,
  ].filter(Boolean);

  const articles: DelpherArticle[] = await Promise.all(
    recordsXml.map(async (recXml, idx) => {
      const title = extractTag(recXml, 'dc:title') || 'Colonial Newspaper Notice';
      const rawDate = extractTag(recXml, 'dc:date');
      const { date, year } = formatIsoDate(rawDate);
      const ocrUrl = extractTag(recXml, 'dc:identifier');
      const newspaper =
        extractTag(recXml, 'dcterms:alternative') ||
        extractTag(recXml, 'dc:publisher').replace(/^\[?\s*s\.n\.?\]?$/i, '') ||
        'Nederlandsch-Indië Press';
      const archiveSource = extractTag(recXml, 'dc:source') || 'Koninklijke Bibliotheek';
      const urnMatch = ocrUrl.match(/urn=(ddd:[^:&]+)/i);
      const urn = urnMatch ? urnMatch[1] : `kb-${idx}`;

      const excerpt = await fetchOcrSnippet(ocrUrl, focusTerms);

      return {
        id: `${urn}-${idx}`,
        title,
        date,
        year,
        newspaper: newspaper || 'Dutch East Indies Press',
        archiveSource,
        excerpt:
          excerpt ||
          `Historical press entry titled "${title}" published on ${date} (${archiveSource}).`,
        citation: `${newspaper || 'Dutch East Indies Press'}, ${date} — KB Delpher (${urn})`,
        urn,
      };
    })
  );

  return {
    query: usedQuery,
    totalFound: total,
    articles,
    sourceApi: 'Koninklijke Bibliotheek (KB) Delpher SRU v1.2',
  };
}
