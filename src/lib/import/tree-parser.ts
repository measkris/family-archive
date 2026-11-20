import * as XLSX from 'xlsx';
import type { FamilyMemberRecord, SpouseRecord } from '@/lib/data/lang-genealogy';
import { normalizePlaceName } from '@/lib/geo/locations';

export interface ParsedMemberDraft {
  tempId: string;
  code: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: 'male' | 'female' | 'unknown';
  generation: number;
  parentCode?: string;
  parentId?: string | null;
  branch: FamilyMemberRecord['branch'];
  birthDate?: string;
  birthYear?: number;
  birthPlace?: string;
  deathDate?: string;
  deathYear?: number;
  deathPlace?: string;
  occupation?: string;
  spouseName?: string;
  spouseBirthDate?: string;
  marriageDate?: string;
  marriagePlace?: string;
  heritageTags: string[];
  bio: string;
  photoUrl?: string;
  sourceUrl?: string;
}

export interface SourceParseResult {
  detectedFormat: 'excel' | 'csv' | 'json' | 'openarchives-api' | 'brouwertree-html' | 'gedcom';
  suggestedTreeName: string;
  suggestedSubtitle: string;
  suggestedRegion: string;
  mappingNotes: string[];
  rawSample: string;
  members: ParsedMemberDraft[];
}

function extractYear(val: unknown): number | undefined {
  if (typeof val === 'number' && val >= 1000 && val <= 2100) return Math.round(val);
  if (typeof val === 'string') {
    const m = val.match(/\b(1[4-9]\d{2}|20\d{2})\b/);
    return m ? Number(m[1]) : undefined;
  }
  return undefined;
}

function normalizeGender(val: unknown): 'male' | 'female' | 'unknown' {
  const s = String(val || '')
    .trim()
    .toLowerCase();
  if (['m', 'male', 'man', 'he', 'son', 'zoon'].includes(s)) return 'male';
  if (['f', 'female', 'woman', 'vrouw', 'daughter', 'dochter'].includes(s)) return 'female';
  return 'unknown';
}

function normalizeBranch(val: unknown): FamilyMemberRecord['branch'] {
  const s = String(val || '')
    .trim()
    .toLowerCase();
  if (s === 'hendrik' || s === 'joseph' || s === 'carolina' || s === 'elisabeth') {
    return s;
  }
  return 'root';
}

function splitName(full: string): { firstName: string; lastName: string } {
  const cleaned = full.replace(/\s+/g, ' ').trim();
  const parts = cleaned.split(' ');
  if (parts.length <= 1) return { firstName: cleaned || 'Unknown', lastName: 'Unknown' };
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
}

/**
 * Builds a ready-to-upload .xlsx template workbook with sample rows + column guide.
 */
export function generateExcelTemplateBuffer(): Buffer {
  const sampleRows = [
    {
      code: 'I',
      firstName: 'Jacob',
      lastName: 'Lang',
      gender: 'male',
      generation: 1,
      parentCode: '',
      branch: 'root',
      birthDate: 'ca. 1805',
      birthYear: 1805,
      birthPlace: 'Manado, North Sulawesi, Indonesia',
      deathDate: '1 December 1845',
      deathYear: 1845,
      deathPlace: 'Manado, North Sulawesi, Indonesia',
      occupation: 'Early European Resident of Manado',
      spouseName: 'Maria Tampemawa',
      spouseBirthDate: 'ca. 1810',
      marriageDate: '12 May 1842',
      marriagePlace: 'Manado, North Sulawesi, Indonesia',
      heritageTags: 'Dutch East Indies, Minahasan, Manado',
      bio: 'Founding patriarch of the Lang-Tampemawa lineage in Manado.',
      photoUrl: '',
    },
    {
      code: 'II-a',
      firstName: 'Hendrik',
      lastName: 'Lang',
      gender: 'male',
      generation: 2,
      parentCode: 'I',
      branch: 'hendrik',
      birthDate: '16 September 1833',
      birthYear: 1833,
      birthPlace: 'Manado, North Sulawesi, Indonesia',
      deathDate: 'after 1895',
      deathYear: 1896,
      deathPlace: 'Kema, North Sulawesi, Indonesia',
      occupation: 'Registered European Inhabitant of Kema',
      spouseName: 'Gritjie Engelen',
      spouseBirthDate: 'ca. 1835',
      marriageDate: 'ca. 1858',
      marriagePlace: 'Manado / Kema',
      heritageTags: 'Indo-Minahasan, Kema',
      bio: 'Eldest son of Jacob Lang and Maria Tampemawa.',
      photoUrl: '',
    },
    {
      code: 'II-b',
      firstName: 'Joseph',
      lastName: 'Lang',
      gender: 'male',
      generation: 2,
      parentCode: 'I',
      branch: 'joseph',
      birthDate: '1 February 1835',
      birthYear: 1835,
      birthPlace: 'Manado, North Sulawesi, Indonesia',
      deathDate: '17 April 1894',
      deathYear: 1894,
      deathPlace: 'Tondano, North Sulawesi, Indonesia',
      occupation: 'Sea Captain & Merchant',
      spouseName: 'Amelia Juliane Weintre',
      spouseBirthDate: '22 May 1846',
      marriageDate: '6 March 1865',
      marriagePlace: 'Manado',
      heritageTags: 'Indo-Minahasan, Maritime Captain, Tondano',
      bio: 'Sea captain and merchant; father of 8 sons and 2 daughters.',
      photoUrl: '',
    },
  ];

  const guideRows = [
    { Column: 'code', Required: 'Recommended', Description: 'Unique generation code like I, II-a, III-b (used by parentCode to link children)' },
    { Column: 'firstName', Required: 'Yes', Description: 'Given / first name (or use fullName if combined)' },
    { Column: 'lastName', Required: 'Yes', Description: 'Family surname' },
    { Column: 'gender', Required: 'Optional', Description: 'male, female, or unknown (controls default cameo illustration)' },
    { Column: 'generation', Required: 'Yes', Description: 'Integer generation number: 1, 2, 3, 4, 5...' },
    { Column: 'parentCode', Required: 'For Gen 2+', Description: 'Code of the parent row (e.g., I or II-a) so the tree draws edges automatically' },
    { Column: 'branch', Required: 'Optional', Description: 'root, hendrik, joseph, carolina, or elisabeth (defaults to root)' },
    { Column: 'birthDate / birthYear', Required: 'Optional', Description: 'Formatted birth date and 4-digit numeric year' },
    { Column: 'birthPlace', Required: 'Optional', Description: 'City / region of birth' },
    { Column: 'deathDate / deathYear / deathPlace', Required: 'Optional', Description: 'Death date, 4-digit year, and place' },
    { Column: 'occupation', Required: 'Optional', Description: 'Profession or civic role' },
    { Column: 'spouseName / spouseBirthDate / marriageDate / marriagePlace', Required: 'Optional', Description: 'Creates a side-by-side spouse card automatically' },
    { Column: 'heritageTags', Required: 'Optional', Description: 'Comma-separated cultural/regional tags' },
    { Column: 'bio', Required: 'Optional', Description: 'Biographical narrative' },
    { Column: 'photoUrl', Required: 'Optional', Description: 'Direct HTTPS image URL (or upload later via Cloudinary)' },
  ];

  const wb = XLSX.utils.book_new();
  const wsMembers = XLSX.utils.json_to_sheet(sampleRows);
  wsMembers['!cols'] = [
    { wch: 8 },
    { wch: 14 },
    { wch: 14 },
    { wch: 10 },
    { wch: 11 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
    { wch: 10 },
    { wch: 24 },
    { wch: 18 },
    { wch: 10 },
    { wch: 22 },
    { wch: 24 },
    { wch: 24 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 30 },
    { wch: 40 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, wsMembers, 'Family_Members');

  const wsGuide = XLSX.utils.json_to_sheet(guideRows);
  wsGuide['!cols'] = [{ wch: 38 }, { wch: 14 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Instructions');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

function mapRawRowToDraft(row: Record<string, unknown>, idx: number): ParsedMemberDraft | null {
  // Flexible key lookup (case-insensitive)
  const lowerMap = new Map<string, unknown>();
  for (const [k, v] of Object.entries(row)) {
    lowerMap.set(k.trim().toLowerCase().replace(/[\s_-]+/g, ''), v);
  }
  const pick = (...keys: string[]): string => {
    for (const k of keys) {
      const val = lowerMap.get(k.toLowerCase().replace(/[\s_-]+/g, ''));
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return String(val).trim();
      }
    }
    return '';
  };

  let firstName = pick('firstName', 'givenName', 'voornaam');
  let lastName = pick('lastName', 'surname', 'familyName', 'achternaam');
  const fullNameRaw = pick('fullName', 'name', 'personName', 'naam');

  if (!firstName && !lastName && fullNameRaw) {
    const split = splitName(fullNameRaw);
    firstName = split.firstName;
    lastName = split.lastName;
  }
  if (!firstName && !lastName) return null;

  const fullName = fullNameRaw || `${firstName} ${lastName}`.trim();
  const generation = Number(pick('generation', 'gen')) || (idx === 0 ? 1 : 2);
  const code = pick('code', 'id', 'parenteelCode') || `G${generation}-${idx + 1}`;
  const birthDate = pick('birthDate', 'born', 'geboren');
  const deathDate = pick('deathDate', 'died', 'overleden');
  const tagsRaw = pick('heritageTags', 'heritage', 'tags');

  return {
    tempId: `imp-${idx}-${code.replace(/[^a-zA-Z0-9_-]/g, '')}`,
    code,
    firstName: firstName || fullName,
    lastName: lastName || 'Unknown',
    fullName,
    gender: normalizeGender(pick('gender', 'sex', 'geslacht')),
    generation,
    parentCode: pick('parentCode', 'parentId', 'parent') || undefined,
    branch: normalizeBranch(pick('branch', 'tak')),
    birthDate: birthDate || undefined,
    birthYear: extractYear(pick('birthYear') || birthDate),
    birthPlace: pick('birthPlace', 'birthLocation', 'place') || undefined,
    deathDate: deathDate || undefined,
    deathYear: extractYear(pick('deathYear') || deathDate),
    deathPlace: pick('deathPlace', 'deathLocation') || undefined,
    occupation: pick('occupation', 'role', 'beroep') || undefined,
    spouseName: pick('spouseName', 'spouse', 'partner') || undefined,
    spouseBirthDate: pick('spouseBirthDate') || undefined,
    marriageDate: pick('marriageDate', 'married') || undefined,
    marriagePlace: pick('marriagePlace') || undefined,
    heritageTags: tagsRaw
      ? tagsRaw
          .split(/[,;|]/)
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
    bio: pick('bio', 'biography', 'notes', 'summary') || '',
    photoUrl: pick('photoUrl', 'avatar', 'image', 'imageUrl') || undefined,
  };
}

/**
 * Parses an uploaded .xlsx, .xls, or .csv buffer into structured ParsedMemberDraft[].
 */
export function parseSpreadsheetBuffer(
  buffer: Buffer,
  fileName: string
): SourceParseResult {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  const members = rows
    .map((r, i) => mapRawRowToDraft(r, i))
    .filter((m): m is ParsedMemberDraft => Boolean(m));

  const isCsv = fileName.toLowerCase().endsWith('.csv');
  const first = members[0];

  return {
    detectedFormat: isCsv ? 'csv' : 'excel',
    suggestedTreeName: first ? `${first.lastName} Family Tree` : 'Imported Family Tree',
    suggestedSubtitle: `Imported from ${fileName} (${members.length} members)`,
    suggestedRegion: first?.birthPlace || 'Archival Lineage',
    mappingNotes: [
      `Read sheet "${sheetName}" (${rows.length} rows found).`,
      'Mapped parentCode -> parentId edges automatically for interactive tree layout.',
      'Spouse columns automatically generate side-by-side couple cards.',
    ],
    rawSample: JSON.stringify(rows.slice(0, 2), null, 2),
    members,
  };
}

/**
 * Parses OpenArchives.nl JSON API output into family tree nodes.
 */
export function parseOpenArchivesJson(json: Record<string, unknown>, sourceUrl: string): SourceParseResult {
  const resp = json.response as { docs?: Array<Record<string, unknown>>; number_found?: number } | undefined;
  const docs = Array.isArray(resp?.docs) ? resp!.docs : [];

  const rootName = String((json.query as { name?: string } | undefined)?.name || 'OpenArchives').trim();
  const rootSplit = splitName(rootName);

  const members: ParsedMemberDraft[] = docs.slice(0, 25).map((d, idx) => {
    const personName = String(d.personname || rootName);
    const { firstName, lastName } = splitName(personName);
    const ev = d.eventdate as { year?: number; month?: number; day?: number } | undefined;
    const evYear = ev?.year ? Number(ev.year) : undefined;
    const evDateStr = ev?.year
      ? [ev.day, ev.month, ev.year].filter(Boolean).join('-')
      : undefined;
    const eventType = String(d.eventtype || 'Historical Record');
    const eventPlace = String(d.eventplace || d.archive || 'Netherlands / N.O.I.');

    return {
      tempId: `oa-${idx}`,
      code: idx === 0 ? 'I' : `II-${String.fromCharCode(97 + (idx - 1))}`,
      firstName,
      lastName,
      fullName: personName,
      gender: 'unknown',
      generation: idx === 0 ? 1 : 2,
      parentCode: idx === 0 ? undefined : 'I',
      branch: 'root',
      birthDate: eventType.toLowerCase().includes('geboorte') || eventType.toLowerCase().includes('birth') ? evDateStr : undefined,
      birthYear: eventType.toLowerCase().includes('geboorte') || eventType.toLowerCase().includes('birth') ? evYear : undefined,
      birthPlace: eventPlace,
      deathDate: eventType.toLowerCase().includes('overlijden') || eventType.toLowerCase().includes('death') ? evDateStr : undefined,
      deathYear: eventType.toLowerCase().includes('overlijden') || eventType.toLowerCase().includes('death') ? evYear : undefined,
      occupation: `${eventType} (${String(d.relationtype || 'Mentioned')})`,
      heritageTags: ['OpenArchives.nl', String(d.archive_code || 'Dutch Archive')],
      bio: `${eventType} recorded at ${eventPlace} (${String(d.archive || 'Regional Archive')}, ${String(d.sourcetype || 'Civil Registry')}).`,
      sourceUrl: String(d.url || sourceUrl),
    };
  });

  return {
    detectedFormat: 'openarchives-api',
    suggestedTreeName: `${rootSplit.lastName} Archive Records (${resp?.number_found ?? members.length})`,
    suggestedSubtitle: `OpenArchives.nl Live API · ${members.length} parsed records`,
    suggestedRegion: members[0]?.birthPlace || 'Netherlands / Dutch East Indies',
    mappingNotes: [
      'Detected OpenArchives.nl REST API v1.0 response (response.docs[]).',
      'Mapped personname -> firstName/lastName, eventdate -> birth/death year, eventplace -> region.',
      'Linked subsequent records under the primary query root (code I) so you can inspect them as a tree.',
    ],
    rawSample: JSON.stringify(docs.slice(0, 2), null, 2),
    members,
  };
}

/**
 * Parses a BrouwerTree-style Parenteel HTML page (e.g. langgene.html, langgene3.html)
 * into structured FamilyMemberDraft nodes.
 */
export function parseBrouwerTreeHtml(html: string, sourceUrl: string): SourceParseResult {
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const pageTitle = (titleMatch?.[1] || 'BrouwerTree Parenteel').replace(/\s+/g, ' ').trim();

  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|table|ol|ul|h\d)>/gi, '\n')
    .replace(/<a[^>]+name=["']?([^"'\s>]+)[^>]*>/gi, '\n[ANCHOR:$1] ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&eacute;/g, 'é')
    .replace(/&euml;/g, 'ë')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n');

  const blocks = text.split(/\[ANCHOR:([^\]]+)\]/g);
  const members: ParsedMemberDraft[] = [];

  for (let i = 1; i < blocks.length; i += 2) {
    const anchor = blocks[i].trim();
    const body = (blocks[i + 1] || '').trim();
    const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    // Line 0 is typically "I.", "II-a.", "III -a.", "IV -a.", "V-a.", "VI -a.", "VII -a."
    const romanMatch = lines[0].match(/^(VIII|VII|VI|IV|V|I{1,3})(?:\s*-\s*([a-z]{1,3}))?\.?/i);
    const roman = romanMatch?.[1]?.toUpperCase() || 'I';
    const sub = romanMatch?.[2]?.toLowerCase() || '';
    const code = sub ? `${roman}-${sub}` : roman;
    const romanToGen: Record<string, number> = {
      I: 1,
      II: 2,
      III: 3,
      IV: 4,
      V: 5,
      VI: 6,
      VII: 7,
      VIII: 8,
    };
    const generation = romanToGen[roman] || 1;

    const nameLine = (lines[1] || '').replace(/,\s*$/, '').replace(/\[.*?\]/g, '').trim();
    if (!nameLine || nameLine.length > 80) continue;
    const { firstName, lastName } = splitName(nameLine);

    const summaryText = lines.slice(2, 10).join(' ');
    const fullBlockForParent = lines.slice(1, 12).join(' ');
    const isFemale = /\bDochter van\b/i.test(summaryText);
    const isMale = /\bZoon van\b/i.test(summaryText);

    const parentRefMatch = fullBlockForParent.match(
      /\[\s*(?:nr\.?\s*)?(VIII|VII|VI|IV|V|I{1,3})(?:\s*-\s*([a-z]{1,3}))?\s*\]/i
    );
    const extractedParentCode = parentRefMatch
      ? parentRefMatch[2]
        ? `${parentRefMatch[1].toUpperCase()}-${parentRefMatch[2].toLowerCase()}`
        : parentRefMatch[1].toUpperCase()
      : generation === 2
      ? 'I'
      : undefined;

    const bornMatch = summaryText.match(/geboren(?:\s+te\s+([^,]+))?\s+(?:op|ca\.?)\s+([^,.]+)/i);
    const diedMatch = summaryText.match(/overleden(?:\s+te\s+([^,]+))?\s+(?:op|ca\.?)\s+([^,.]+)/i);
    const marriedMatch = summaryText.match(/Gehuwd(?:\s*\(\d+\))?(?:\s+te\s+([^,]+))?(?:\s+op\s+([^,]+))?\s+met\s+([^,.]+)/i);

    members.push({
      tempId: `bt-${anchor}`,
      code,
      firstName,
      lastName: lastName.replace(/\.$/, ''),
      fullName: `${firstName} ${lastName.replace(/\.$/, '')}`,
      gender: isFemale ? 'female' : isMale ? 'male' : 'unknown',
      generation,
      parentCode: extractedParentCode,
      branch: 'root',
      birthDate: bornMatch?.[2]?.trim(),
      birthYear: extractYear(bornMatch?.[2]),
      birthPlace: bornMatch?.[1] ? normalizePlaceName(bornMatch[1].trim()) : undefined,
      deathDate: diedMatch?.[2]?.trim(),
      deathYear: extractYear(diedMatch?.[2]),
      deathPlace: diedMatch?.[1] ? normalizePlaceName(diedMatch[1].trim()) : undefined,
      spouseName: marriedMatch?.[3]?.trim(),
      marriageDate: marriedMatch?.[2]?.trim(),
      marriagePlace: marriedMatch?.[1] ? normalizePlaceName(marriedMatch[1].trim()) : undefined,
      heritageTags: ['BrouwerTree Parenteel', 'Dutch East Indies'],
      bio: summaryText.replace(/\bMenado\b/g, 'Manado').slice(0, 320),
      sourceUrl,
    });
  }

  return {
    detectedFormat: 'brouwertree-html',
    suggestedTreeName: pageTitle || 'BrouwerTree Parenteel Import',
    suggestedSubtitle: `Parsed from ${sourceUrl.replace(/^https?:\/\/(www\.)?/, '')}`,
    suggestedRegion: members[0]?.birthPlace || 'Dutch East Indies / Netherlands',
    mappingNotes: [
      `Detected BrouwerTree HTML Parenteel structure (${members.length} numbered head entries).`,
      'Extracted Roman numeral generation codes (I, II-a, III-a), birth/death dates, and "Gehuwd met" spouses.',
      'Preserved original source URL citation on every imported node.',
    ],
    rawSample: text.slice(0, 500),
    members,
  };
}

/**
 * Parses generic JSON (either FamilyMemberRecord[] or { members: [...] } or OpenArchives JSON).
 */
export function parseJsonString(rawText: string, sourceLabel: string): SourceParseResult {
  const parsed = JSON.parse(rawText);

  if (parsed && typeof parsed === 'object' && parsed.response?.docs) {
    return parseOpenArchivesJson(parsed as Record<string, unknown>, sourceLabel);
  }

  const arr: Array<Record<string, unknown>> = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.members)
    ? parsed.members
    : Array.isArray(parsed?.data)
    ? parsed.data
    : [];

  const members = arr
    .map((r, i) => mapRawRowToDraft(r, i))
    .filter((m): m is ParsedMemberDraft => Boolean(m));

  return {
    detectedFormat: 'json',
    suggestedTreeName: parsed?.treeName || parsed?.name || 'JSON Family Import',
    suggestedSubtitle: `Parsed JSON (${members.length} members)`,
    suggestedRegion: members[0]?.birthPlace || 'Archival Lineage',
    mappingNotes: [
      `Parsed ${members.length} JSON records from ${sourceLabel}.`,
      'Mapped parentCode / parentId links and spouse fields automatically.',
    ],
    rawSample: JSON.stringify(arr.slice(0, 2), null, 2),
    members,
  };
}

interface RawGedcomIndi {
  id: string;
  code?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  gender: 'male' | 'female' | 'unknown';
  birthDate?: string;
  birthYear?: number;
  birthPlace?: string;
  deathDate?: string;
  deathYear?: number;
  deathPlace?: string;
  occupation?: string;
  bio?: string;
  famc?: string;
  fams: string[];
}

interface RawGedcomFam {
  id: string;
  husb?: string;
  wife?: string;
  children: string[];
  marrDate?: string;
  marrPlace?: string;
}

/**
 * Parses standard GEDCOM 5.5.1 / 7.0 text exported from FamilySearch, RootsFinder, Ancestry, etc.
 */
export function parseGedcomString(rawText: string, sourceLabel: string): SourceParseResult {
  const lines = rawText.split(/\r?\n/);
  const indis = new Map<string, RawGedcomIndi>();
  const fams = new Map<string, RawGedcomFam>();

  let currentIndi: RawGedcomIndi | null = null;
  let currentFam: RawGedcomFam | null = null;
  let currentEvent: 'BIRT' | 'DEAT' | 'MARR' | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Match level 0 record definition: 0 @I1@ INDI or 0 @F1@ FAM
    const level0Match = line.match(/^0\s+(@[^@]+@)\s+(INDI|FAM)/i);
    if (level0Match) {
      const id = level0Match[1];
      const type = level0Match[2].toUpperCase();
      currentEvent = null;

      if (type === 'INDI') {
        currentIndi = {
          id,
          gender: 'unknown',
          fams: [],
        };
        indis.set(id, currentIndi);
        currentFam = null;
      } else if (type === 'FAM') {
        currentFam = {
          id,
          children: [],
        };
        fams.set(id, currentFam);
        currentIndi = null;
      }
      continue;
    }

    if (currentIndi) {
      if (line.startsWith('1 NAME')) {
        const nameContent = line.substring(6).trim();
        const slashMatch = nameContent.match(/^(.*?)\s*\/([^/]*)\/(.*)$/);
        if (slashMatch) {
          const first = (slashMatch[1] + (slashMatch[3] ? ' ' + slashMatch[3] : '')).trim();
          const last = slashMatch[2].trim();
          currentIndi.firstName = first || nameContent.replace(/\//g, '').trim();
          currentIndi.lastName = last || 'Unknown';
          currentIndi.fullName = `${currentIndi.firstName} ${currentIndi.lastName}`.trim();
        } else {
          currentIndi.fullName = nameContent;
          const split = splitName(nameContent);
          currentIndi.firstName = split.firstName;
          currentIndi.lastName = split.lastName;
        }
        currentEvent = null;
      } else if (line.startsWith('2 GIVN')) {
        currentIndi.firstName = line.substring(6).trim();
        if (currentIndi.lastName) {
          currentIndi.fullName = `${currentIndi.firstName} ${currentIndi.lastName}`.trim();
        }
      } else if (line.startsWith('2 SURN')) {
        currentIndi.lastName = line.substring(6).trim();
        if (currentIndi.firstName) {
          currentIndi.fullName = `${currentIndi.firstName} ${currentIndi.lastName}`.trim();
        }
      } else if (line.startsWith('1 SEX')) {
        const s = line.substring(5).trim().toUpperCase();
        currentIndi.gender = s === 'M' ? 'male' : s === 'F' ? 'female' : 'unknown';
        currentEvent = null;
      } else if (line.startsWith('1 BIRT')) {
        currentEvent = 'BIRT';
      } else if (line.startsWith('1 DEAT')) {
        currentEvent = 'DEAT';
      } else if (line.startsWith('1 OCCU')) {
        currentIndi.occupation = line.substring(6).trim();
        currentEvent = null;
      } else if (line.startsWith('1 NOTE')) {
        const note = line.substring(6).trim();
        currentIndi.bio = currentIndi.bio ? `${currentIndi.bio} ${note}` : note;
      } else if (line.startsWith('1 REFN')) {
        currentIndi.code = line.substring(6).trim();
      } else if (line.startsWith('1 FAMC')) {
        const famcMatch = line.match(/@([^@]+)@/);
        if (famcMatch) currentIndi.famc = `@${famcMatch[1]}@`;
      } else if (line.startsWith('1 FAMS')) {
        const famsMatch = line.match(/@([^@]+)@/);
        if (famsMatch) currentIndi.fams.push(`@${famsMatch[1]}@`);
      } else if (currentEvent === 'BIRT') {
        if (line.startsWith('2 DATE')) {
          currentIndi.birthDate = line.substring(6).trim();
          currentIndi.birthYear = extractYear(currentIndi.birthDate);
        } else if (line.startsWith('2 PLAC')) {
          currentIndi.birthPlace = normalizePlaceName(line.substring(6).trim());
        }
      } else if (currentEvent === 'DEAT') {
        if (line.startsWith('2 DATE')) {
          currentIndi.deathDate = line.substring(6).trim();
          currentIndi.deathYear = extractYear(currentIndi.deathDate);
        } else if (line.startsWith('2 PLAC')) {
          currentIndi.deathPlace = normalizePlaceName(line.substring(6).trim());
        }
      }
    } else if (currentFam) {
      if (line.startsWith('1 HUSB')) {
        const m = line.match(/@([^@]+)@/);
        if (m) currentFam.husb = `@${m[1]}@`;
      } else if (line.startsWith('1 WIFE')) {
        const m = line.match(/@([^@]+)@/);
        if (m) currentFam.wife = `@${m[1]}@`;
      } else if (line.startsWith('1 CHIL')) {
        const m = line.match(/@([^@]+)@/);
        if (m) currentFam.children.push(`@${m[1]}@`);
      } else if (line.startsWith('1 MARR')) {
        currentEvent = 'MARR';
      } else if (currentEvent === 'MARR') {
        if (line.startsWith('2 DATE')) {
          currentFam.marrDate = line.substring(6).trim();
        } else if (line.startsWith('2 PLAC')) {
          currentFam.marrPlace = normalizePlaceName(line.substring(6).trim());
        }
      }
    }
  }

  // Calculate generation depths for each individual using BFS from roots
  const genMap = new Map<string, number>();
  for (const [id, indi] of indis.entries()) {
    if (!indi.famc) {
      genMap.set(id, 1);
    } else {
      const fam = fams.get(indi.famc);
      if (!fam || (!fam.husb && !fam.wife)) {
        genMap.set(id, 1);
      }
    }
  }

  // BFS down family tree to propagate generation
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 30) {
    changed = false;
    iterations++;
    for (const [, fam] of fams.entries()) {
      const parentGen = Math.max(
        fam.husb ? genMap.get(fam.husb) || 0 : 0,
        fam.wife ? genMap.get(fam.wife) || 0 : 0
      );
      if (parentGen > 0) {
        for (const childId of fam.children) {
          const currentGen = genMap.get(childId) || 0;
          if (currentGen < parentGen + 1) {
            genMap.set(childId, parentGen + 1);
            changed = true;
          }
        }
      }
    }
  }

  // Convert to ParsedMemberDraft[]
  const members: ParsedMemberDraft[] = [];
  let idx = 0;
  for (const [id, indi] of indis.entries()) {
    idx++;
    const generation = genMap.get(id) || 1;
    const cleanCode = indi.code || (generation === 1 && idx === 1 ? 'I' : `G${generation}-${idx}`);

    let parentCode: string | undefined = undefined;
    if (indi.famc) {
      const fam = fams.get(indi.famc);
      if (fam) {
        const parentId = fam.husb || fam.wife;
        if (parentId) {
          const parentIndi = indis.get(parentId);
          parentCode = parentIndi?.code || parentId.replace(/@/g, '');
        }
      }
    }

    let spouseName: string | undefined = undefined;
    let marriageDate: string | undefined = undefined;
    let marriagePlace: string | undefined = undefined;
    if (indi.fams.length > 0) {
      const fam = fams.get(indi.fams[0]);
      if (fam) {
        marriageDate = fam.marrDate;
        marriagePlace = fam.marrPlace;
        const spouseId = fam.husb === id ? fam.wife : fam.husb;
        if (spouseId) {
          const spIndi = indis.get(spouseId);
          spouseName = spIndi?.fullName || spIndi?.firstName;
        }
      }
    }

    const firstName = indi.firstName || indi.fullName?.split(' ')[0] || 'Unknown';
    const lastName = indi.lastName || indi.fullName?.split(' ').slice(1).join(' ') || 'Unknown';
    const fullName = indi.fullName || `${firstName} ${lastName}`.trim();

    members.push({
      tempId: id.replace(/@/g, ''),
      code: cleanCode,
      firstName,
      lastName,
      fullName,
      gender: indi.gender,
      generation,
      parentCode,
      branch: 'root',
      birthDate: indi.birthDate,
      birthYear: indi.birthYear,
      birthPlace: indi.birthPlace,
      deathDate: indi.deathDate,
      deathYear: indi.deathYear,
      deathPlace: indi.deathPlace,
      occupation: indi.occupation,
      spouseName,
      marriageDate,
      marriagePlace,
      heritageTags: ['GEDCOM Import', 'FamilySearch Ecosystem'],
      bio: indi.bio || '',
      sourceUrl: sourceLabel,
    });
  }

  const first = members[0];
  return {
    detectedFormat: 'gedcom',
    suggestedTreeName: first?.lastName ? `${first.lastName} Lineage (GEDCOM)` : 'GEDCOM Family Tree',
    suggestedSubtitle: `Parsed standard GEDCOM 5.5.1 from ${sourceLabel} (${members.length} members)`,
    suggestedRegion: first?.birthPlace || 'Archival Lineage',
    mappingNotes: [
      `Parsed standard GEDCOM file (${indis.size} individuals, ${fams.size} family units).`,
      'Mapped parent-child linkages via FAMC/CHIL tags automatically.',
      'Extracted birth, death, marriage dates and places into interactive tree layout.',
      'Fully compatible with FamilySearch Genealogies and Solutions Gallery partners.',
    ],
    rawSample: rawText.slice(0, 500),
    members,
  };
}

/**
 * Converts ParsedMemberDraft[] into ready-to-save FamilyMemberRecord[] with resolved parentId links.
 */
export function finalizeDraftsForTree(
  drafts: ParsedMemberDraft[],
  treeId: string,
  existingTreeMembers: FamilyMemberRecord[] = []
): FamilyMemberRecord[] {
  const codeToId = new Map<string, string>();
  for (const m of existingTreeMembers) {
    codeToId.set(m.code.toLowerCase(), m.id);
  }

  // Assign stable unique IDs first
  const batchId = Date.now().toString(36);
  const assignedIds = drafts.map((d, i) => {
    const id = `${treeId}-${d.code.replace(/[^a-zA-Z0-9_-]/g, '')}-${batchId}-${i}`;
    codeToId.set(d.code.toLowerCase(), id);
    return id;
  });

  return drafts.map((d, i) => {
    const id = assignedIds[i];
    const resolvedParentId = d.parentId
      ? d.parentId
      : d.parentCode
      ? codeToId.get(d.parentCode.toLowerCase()) || null
      : null;

    const spouses: SpouseRecord[] = d.spouseName
      ? [
          {
            id: `sp-${id}-1`,
            name: d.spouseName,
            surname: splitName(d.spouseName).lastName,
            marriageOrder: 1,
            birthDate: d.spouseBirthDate,
            marriageDate: d.marriageDate,
            marriagePlace: d.marriagePlace,
          },
        ]
      : [];

    return {
      id,
      treeId,
      code: d.code,
      firstName: d.firstName,
      lastName: d.lastName,
      fullName: d.fullName,
      gender: d.gender,
      generation: d.generation,
      branch: d.branch,
      parentId: resolvedParentId,
      birthDate: d.birthDate,
      birthYear: d.birthYear,
      birthPlace: d.birthPlace,
      deathDate: d.deathDate,
      deathYear: d.deathYear,
      deathPlace: d.deathPlace,
      occupation: d.occupation,
      heritageTags: d.heritageTags,
      region: d.birthPlace || 'Archival Lineage',
      photoUrl: d.photoUrl,
      bio: d.bio,
      spouses,
      sources: [d.sourceUrl ? `Imported from ${d.sourceUrl}` : 'Bulk Excel/CSV Import'],
      sourceUrl: d.sourceUrl || '',
      isFeatured: d.generation === 1,
    };
  });
}
