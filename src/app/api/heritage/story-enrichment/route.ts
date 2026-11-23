import { NextRequest, NextResponse } from 'next/server';
import { searchDelpherPress, type DelpherArticle } from '@/lib/heritage/delpher';

export interface WikiTreeMatch {
  id: number;
  wikitreeId: string;
  fullName: string;
  birthDate: string;
  deathDate: string;
  birthLocation: string;
  deathLocation: string;
  hasParents: boolean;
  reference: string;
}

export interface PlaceStoryContext {
  title: string;
  summary: string;
  sourceRef: string;
}

export interface HistoricalEraBackdrop {
  eraTitle: string;
  yearsLabel: string;
  narrative: string;
}

export interface ArchivalReferenceItem {
  id: string;
  source: string;
  collection: string;
  scope: string;
  note: string;
}

export interface StoryEnrichmentResponse {
  personName: string;
  eraBackdrop: HistoricalEraBackdrop;
  placeContext: PlaceStoryContext | null;
  pressClippings: DelpherArticle[];
  pressTotalFound: number;
  pressQuery: string;
  wikitreeMatches: WikiTreeMatch[];
  wikitreeTotal: number;
  connectedApis: string[];
  references: ArchivalReferenceItem[];
  fetchedAt: string;
}

function resolveHistoricalEra(birthYear?: number, deathYear?: number): HistoricalEraBackdrop {
  const anchor = birthYear || (deathYear ? deathYear - 45 : 1860);

  if (anchor < 1840) {
    return {
      eraTitle: 'Post-VOC Transition & Early Residentie Manado',
      yearsLabel: '1800 – 1850',
      narrative:
        'Following the dissolution of the Dutch East India Company (VOC) in 1799 and the British interregnum, North Sulawesi came under the Residentie Manado administration. European settlers, sea traders, and indigenous Minahasan clans forged close civic, mercantile, and kinship bonds anchored around Manado harbor, Kema, and the Minahasa highlands.',
    };
  }
  if (anchor < 1885) {
    return {
      eraTitle: 'Maritime Commerce, Minahasa District Governance & Nutmeg Estates',
      yearsLabel: '1850 – 1900',
      narrative:
        'The late 19th century saw rapid civic growth across Minahasa and the Dutch East Indies. Coastal schooners linked Manado, Kema, and Ternate to Makassar and Batavia, while Minahasan district leaders (Majoors / Hukum Besar) and European civil registries documented thriving estates, plantations, and Dutch–Minahasan family alliances.',
    };
  }
  if (anchor < 1920) {
    return {
      eraTitle: 'Archipelago Careers, State Railways & Wartime Upheaval',
      yearsLabel: '1900 – 1945',
      narrative:
        'This generation expanded beyond North Sulawesi into Java and Sumatra — serving in the State Railways (Staatsspoorwegen), PTT telecommunications, mining, and municipal councils — before enduring the profound trials of World War II and the 1942–1945 occupation across Indonesia.',
    };
  }
  if (anchor < 1955) {
    return {
      eraTitle: 'Indonesian Independence & Global Indische Diaspora',
      yearsLabel: '1945 – 1975',
      narrative:
        'Bridging Indonesian independence and post-war migration, members of this generation carried the Lang–Tampemawa heritage forward both within modern Indonesia (Manado, Jakarta, Java) and across new homes in the Netherlands, Canada, and the United States.',
    };
  }
  return {
    eraTitle: 'Contemporary Multigenerational Heritage',
    yearsLabel: '1975 – Present',
    narrative:
      'Spanning the sixth through eighth generations since Jacob Lang and Maria Tampemawa in Manado, contemporary descendants preserve a living cross-continental heritage linking North Sulawesi, Java, the Netherlands, and North America.',
  };
}

function resolveWikipediaSlug(region: string, place: string): { slug: string; label: string } {
  const combined = `${place} ${region}`.toLowerCase();
  if (combined.includes('tombariri')) return { slug: 'Minahasa_Regency', label: 'Tombariri & Minahasa' };
  if (combined.includes('tondano')) return { slug: 'Tondano', label: 'Tondano' };
  if (combined.includes('kema')) return { slug: 'Kema,_North_Sulawesi', label: 'Kema Port, North Sulawesi' };
  if (combined.includes('groningen')) return { slug: 'Groningen', label: 'Groningen, Netherlands' };
  if (combined.includes('bandung') || combined.includes('bandoeng')) return { slug: 'Bandung', label: 'Bandung, West Java' };
  if (combined.includes('malang')) return { slug: 'Malang', label: 'Malang, East Java' };
  if (combined.includes('blitar')) return { slug: 'Blitar', label: 'Blitar, East Java' };
  if (combined.includes('surabaya') || combined.includes('soerabaja')) return { slug: 'Surabaya', label: 'Surabaya, East Java' };
  if (combined.includes('hague') || combined.includes('gravenhage')) return { slug: 'Indo_people', label: 'Indische Community in The Hague' };
  if (combined.includes('manado') || combined.includes('menado')) return { slug: 'Manado', label: 'Manado, North Sulawesi' };
  if (combined.includes('minahasa')) return { slug: 'Minahasan_people', label: 'Minahasa, North Sulawesi' };
  return { slug: 'North_Sulawesi', label: 'North Sulawesi, Indonesia' };
}

async function fetchPlaceContext(region: string, place: string): Promise<PlaceStoryContext | null> {
  const { slug, label } = resolveWikipediaSlug(region, place);
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`,
      {
        headers: { 'User-Agent': 'LangTampemawaFamilyArchive/1.0' },
        signal: AbortSignal.timeout(4500),
        next: { revalidate: 86400 },
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.extract) return null;
    return {
      title: String(json.title || label),
      summary: String(json.extract),
      sourceRef: `Wikimedia / Wikipedia Historical Gazetteer (${json.title || slug})`,
    };
  } catch {
    return null;
  }
}

async function fetchWikiTreeMatches(
  firstName: string,
  surname: string,
  birthYear?: number
): Promise<{ total: number; matches: WikiTreeMatch[] }> {
  if (!surname) return { total: 0, matches: [] };
  try {
    const params = new URLSearchParams({
      action: 'searchPerson',
      LastName: surname,
      fields: 'Id,Name,FirstName,MiddleName,LastNameAtBirth,BirthDate,DeathDate,BirthLocation,DeathLocation,Father,Mother',
      limit: '15',
      format: 'json',
      appId: 'FamilyArchiveApp',
    });
    if (firstName) params.set('FirstName', firstName.split(' ')[0]);

    const res = await fetch(`https://api.wikitree.com/api.php?${params.toString()}`, {
      headers: { 'User-Agent': 'LangTampemawaFamilyArchive/1.0' },
      signal: AbortSignal.timeout(5500),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { total: 0, matches: [] };
    const data = await res.json();
    const bucket = Array.isArray(data) ? data[0] : null;
    const rawMatches = Array.isArray(bucket?.matches) ? bucket.matches : [];
    const total = Number(bucket?.total ?? rawMatches.length);

    // Prioritize matches linked to Netherlands, Indonesia, Dutch East Indies, or close birth year
    const geoHint = /nederland|netherlands|holland|groningen|indie|indonesia|java|celebes|sulawesi|manado|menado|batavia|soerabaja|surabaya|bandung|bandoeng|amsterdam|hague|gravenhage|velp|breda/i;

    const scored = rawMatches
      .map((m: Record<string, unknown>) => {
        const bLoc = String(m.BirthLocation || '');
        const dLoc = String(m.DeathLocation || '');
        const bDate = String(m.BirthDate || '');
        const dDate = String(m.DeathDate || '');
        const bYrMatch = bDate.match(/^(\d{4})/);
        const bYr = bYrMatch && Number(bYrMatch[1]) > 1500 ? Number(bYrMatch[1]) : null;

        let score = 0;
        if (geoHint.test(bLoc) || geoHint.test(dLoc)) score += 10;
        if (birthYear && bYr) {
          const diff = Math.abs(birthYear - bYr);
          if (diff <= 5) score += 8;
          else if (diff <= 15) score += 4;
          else if (diff > 40) score -= 4;
        }
        if (Number(m.Father) > 0 || Number(m.Mother) > 0) score += 2;

        const nameParts = [m.FirstName, m.MiddleName, m.LastNameAtBirth]
          .map((x) => String(x || '').trim())
          .filter(Boolean);

        return {
          score,
          item: {
            id: Number(m.Id || 0),
            wikitreeId: String(m.Name || ''),
            fullName: nameParts.join(' ') || `${firstName} ${surname}`.trim(),
            birthDate: bDate && bDate !== '0000-00-00' ? bDate : 'Unknown',
            deathDate: dDate && dDate !== '0000-00-00' ? dDate : 'Unknown',
            birthLocation: bLoc || 'Location unrecorded',
            deathLocation: dLoc || '',
            hasParents: Number(m.Father) > 0 || Number(m.Mother) > 0,
            reference: `WikiTree Collaborative Tree — Profile ID ${String(m.Name || m.Id)}`,
          },
        };
      })
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
      .slice(0, 4)
      .map((entry: { item: WikiTreeMatch }) => entry.item);

    return { total, matches: scored };
  } catch {
    return { total: 0, matches: [] };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fullName = (searchParams.get('name') || '').trim();
  const firstName = (searchParams.get('firstName') || fullName.split(' ')[0] || '').trim();
  const surname = (searchParams.get('surname') || fullName.split(' ').slice(-1)[0] || '').trim();
  const place = (searchParams.get('place') || '').trim();
  const region = (searchParams.get('region') || 'Manado, North Sulawesi, Indonesia').trim();
  const birthYearRaw = Number(searchParams.get('birthYear'));
  const deathYearRaw = Number(searchParams.get('deathYear'));
  const birthYear = Number.isFinite(birthYearRaw) && birthYearRaw > 1600 ? birthYearRaw : undefined;
  const deathYear = Number.isFinite(deathYearRaw) && deathYearRaw > 1600 ? deathYearRaw : undefined;

  const [delpherResult, placeContext, wikitreeResult] = await Promise.all([
    searchDelpherPress({ surname, firstName, place: `${place} ${region}`, limit: 4 }),
    fetchPlaceContext(region, place),
    fetchWikiTreeMatches(firstName, surname, birthYear),
  ]);

  const eraBackdrop = resolveHistoricalEra(birthYear, deathYear);

  const references: ArchivalReferenceItem[] = [
    {
      id: 'ref-fs-1806941',
      source: 'FamilySearch Historical Records',
      collection: 'Indonesia, Civil Registration, 1806–1997 (Collection 1806941)',
      scope: 'Colonial & Indonesian births, marriages, and death registers (Manado, Batavia, Surabaya)',
      note: 'Indexed via FamilySearch Genealogies & Solutions Gallery ecosystem',
    },
    {
      id: 'ref-brouwertree',
      source: 'BrouwerTree Parenteel',
      collection: 'Parenteel van Jacob Lang en Maria Tampemawa (Parts I–VII)',
      scope: 'Eight documented generations (1805–1999+) across Manado, Tondano, Kema, Java & Netherlands',
      note: 'Compiled from Regerings-Almanak van Nederlandsch-Indië & family correspondence',
    },
    {
      id: 'ref-kb-delpher',
      source: 'Koninklijke Bibliotheek (KB) Delpher',
      collection: 'Historical Dutch & Dutch East Indies Newspapers (SRU v1.2 Live API)',
      scope: 'Java-Bode, De Indische Courant, Bataviaasch Nieuwsblad, Makassaarsche Courant',
      note: `Live query returned ${delpherResult.totalFound.toLocaleString()} historical press entries`,
    },
    {
      id: 'ref-openarch',
      source: 'OpenArchives.nl (Open Archieven)',
      collection: 'Dutch & Regional Municipal Civil Registries (REST API v1.0)',
      scope: 'Groningen, The Hague, Amsterdam, and colonial passenger/civil records',
      note: 'Connected live in-app for civil hints and surname origin counts',
    },
    {
      id: 'ref-wikitree',
      source: 'WikiTree Global Collaborative Tree',
      collection: 'WikiTree Public Genealogy API (FamilySearch Partner Ecosystem)',
      scope: 'Cross-referenced public profiles for extended ancestor & collateral branch discovery',
      note: `Live query found ${wikitreeResult.total.toLocaleString()} surname profiles`,
    },
  ];

  const payload: StoryEnrichmentResponse = {
    personName: fullName || `${firstName} ${surname}`.trim(),
    eraBackdrop,
    placeContext,
    pressClippings: delpherResult.articles,
    pressTotalFound: delpherResult.totalFound,
    pressQuery: delpherResult.query,
    wikitreeMatches: wikitreeResult.matches,
    wikitreeTotal: wikitreeResult.total,
    connectedApis: [
      'KB Delpher SRU v1.2 (Live Press OCR)',
      'OpenArchives.nl API v1.0 (Civil Registries)',
      'WikiTree Public API (Global Lineage)',
      'Wikimedia REST API (Regional Gazetteer)',
    ],
    references,
    fetchedAt: new Date().toISOString(),
  };

  return NextResponse.json(payload);
}
