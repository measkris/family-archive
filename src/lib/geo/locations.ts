export interface GeoLocationInfo {
  id: string;
  city: string;
  province: string;
  country: string;
  fullLabel: string; // e.g., "Manado, North Sulawesi, Indonesia"
  historicalName: string;
  lat: number;
  lon: number;
  regionGroup: 'sulawesi' | 'java' | 'maluku-sumatra' | 'netherlands' | 'north-america';
  aliases: string[];
}

export const KNOWN_ANCESTRAL_LOCATIONS: GeoLocationInfo[] = [
  {
    id: 'place-manado',
    city: 'Manado',
    province: 'North Sulawesi',
    country: 'Indonesia',
    fullLabel: 'Manado, North Sulawesi, Indonesia',
    historicalName: 'Residentie Manado (formerly Menado), N.O.I.',
    lat: 1.4748,
    lon: 124.8421,
    regionGroup: 'sulawesi',
    aliases: ['manado', 'menado', 'minahasa', 'minahassa', 'mukupa', 'tateli'],
  },
  {
    id: 'place-tondano',
    city: 'Tondano',
    province: 'North Sulawesi',
    country: 'Indonesia',
    fullLabel: 'Tondano, North Sulawesi, Indonesia',
    historicalName: 'Afdeeling Tondano, Minahasa',
    lat: 1.3036,
    lon: 124.9114,
    regionGroup: 'sulawesi',
    aliases: ['tondano', 'lake tondano'],
  },
  {
    id: 'place-kema',
    city: 'Kema',
    province: 'North Sulawesi',
    country: 'Indonesia',
    fullLabel: 'Kema, North Sulawesi, Indonesia',
    historicalName: 'Kema Port, North Celebes',
    lat: 1.3672,
    lon: 125.0758,
    regionGroup: 'sulawesi',
    aliases: ['kema'],
  },
  {
    id: 'place-tombariri',
    city: 'Tombariri',
    province: 'North Sulawesi',
    country: 'Indonesia',
    fullLabel: 'Tombariri, North Sulawesi, Indonesia',
    historicalName: 'District Tombariri, Minahasa',
    lat: 1.3833,
    lon: 124.6833,
    regionGroup: 'sulawesi',
    aliases: ['tombariri', 'sonder', 'amurang', 'amoerang'],
  },
  {
    id: 'place-makassar',
    city: 'Makassar',
    province: 'South Sulawesi',
    country: 'Indonesia',
    fullLabel: 'Makassar, South Sulawesi, Indonesia',
    historicalName: 'Makassar / Ujung Pandang, Celebes',
    lat: -5.1477,
    lon: 119.4327,
    regionGroup: 'sulawesi',
    aliases: ['makassar', 'mandar', 'majene'],
  },
  {
    id: 'place-ternate',
    city: 'Ternate',
    province: 'North Maluku',
    country: 'Indonesia',
    fullLabel: 'Ternate, North Maluku, Indonesia',
    historicalName: 'Gouvernement der Molukken, Ternate',
    lat: 0.7893,
    lon: 127.3878,
    regionGroup: 'maluku-sumatra',
    aliases: ['ternate'],
  },
  {
    id: 'place-ambon',
    city: 'Ambon',
    province: 'Maluku',
    country: 'Indonesia',
    fullLabel: 'Ambon, Maluku, Indonesia',
    historicalName: 'Amboina, VOC Moluccas',
    lat: -3.6954,
    lon: 128.1814,
    regionGroup: 'maluku-sumatra',
    aliases: ['ambon', 'amboina'],
  },
  {
    id: 'place-blitar',
    city: 'Blitar',
    province: 'East Java',
    country: 'Indonesia',
    fullLabel: 'Blitar, East Java, Indonesia',
    historicalName: 'Blitar, Residentie Kediri, Oost-Java',
    lat: -8.0955,
    lon: 112.1609,
    regionGroup: 'java',
    aliases: ['blitar'],
  },
  {
    id: 'place-malang',
    city: 'Malang',
    province: 'East Java',
    country: 'Indonesia',
    fullLabel: 'Malang, East Java, Indonesia',
    historicalName: 'Malang, Oost-Java',
    lat: -7.9666,
    lon: 112.6326,
    regionGroup: 'java',
    aliases: ['malang', 'probolinggo', 'nganjuk'],
  },
  {
    id: 'place-surabaya',
    city: 'Surabaya',
    province: 'East Java',
    country: 'Indonesia',
    fullLabel: 'Surabaya, East Java, Indonesia',
    historicalName: 'Soerabaja, Oost-Java',
    lat: -7.2575,
    lon: 112.7521,
    regionGroup: 'java',
    aliases: ['surabaya', 'soerabaja'],
  },
  {
    id: 'place-jakarta',
    city: 'Jakarta (Batavia)',
    province: 'DKI Jakarta',
    country: 'Indonesia',
    fullLabel: 'Jakarta (Batavia), DKI Jakarta, Indonesia',
    historicalName: 'Batavia, Nederlandsch-Indië',
    lat: -6.2088,
    lon: 106.8456,
    regionGroup: 'java',
    aliases: ['batavia', 'jakarta', 'weltevreden'],
  },
  {
    id: 'place-bandung',
    city: 'Bandung',
    province: 'West Java',
    country: 'Indonesia',
    fullLabel: 'Bandung, West Java, Indonesia',
    historicalName: 'Bandoeng & Cimahi, West-Java',
    lat: -6.9175,
    lon: 107.6191,
    regionGroup: 'java',
    aliases: ['bandung', 'bandoeng', 'cimahi', 'leuwigajah'],
  },
  {
    id: 'place-semarang',
    city: 'Semarang',
    province: 'Central Java',
    country: 'Indonesia',
    fullLabel: 'Semarang, Central Java, Indonesia',
    historicalName: 'Samarang & Tegal, Midden-Java',
    lat: -6.9667,
    lon: 110.4167,
    regionGroup: 'java',
    aliases: ['semarang', 'tegal', 'blora', 'rembang'],
  },
  {
    id: 'place-breda',
    city: 'Breda',
    province: 'North Brabant',
    country: 'Netherlands',
    fullLabel: 'Breda, North Brabant, Netherlands',
    historicalName: 'Breda & Velp / Rozendaal, Nederland',
    lat: 51.5719,
    lon: 4.7683,
    regionGroup: 'netherlands',
    aliases: ['breda', 'velp', 'rozendaal', 'rheden', 'schiedam'],
  },
  {
    id: 'place-haarlem',
    city: 'Haarlem',
    province: 'North Holland',
    country: 'Netherlands',
    fullLabel: 'Haarlem, North Holland, Netherlands',
    historicalName: 'Haarlem & Hoofddorp, Noord-Holland',
    lat: 52.3874,
    lon: 4.6462,
    regionGroup: 'netherlands',
    aliases: ['haarlem', 'hoofddorp'],
  },
  {
    id: 'place-palembang',
    city: 'Palembang',
    province: 'South Sumatra',
    country: 'Indonesia',
    fullLabel: 'Palembang, South Sumatra, Indonesia',
    historicalName: 'Palembang & Mentok (Bangka), Sumatra',
    lat: -2.9761,
    lon: 104.7754,
    regionGroup: 'maluku-sumatra',
    aliases: ['palembang', 'mentok', 'bangka', 'billiton', 'belitung'],
  },
  {
    id: 'place-groningen',
    city: 'Groningen',
    province: 'Groningen',
    country: 'Netherlands',
    fullLabel: 'Groningen, Groningen, Netherlands',
    historicalName: 'Stad Groningen, Koninkrijk der Nederlanden',
    lat: 53.2194,
    lon: 6.5665,
    regionGroup: 'netherlands',
    aliases: ['groningen'],
  },
  {
    id: 'place-the-hague',
    city: 'The Hague',
    province: 'South Holland',
    country: 'Netherlands',
    fullLabel: 'The Hague, South Holland, Netherlands',
    historicalName: "'s-Gravenhage / Den Haag, Nederland",
    lat: 52.0705,
    lon: 4.3007,
    regionGroup: 'netherlands',
    aliases: ['the hague', 'den haag', 's-gravenhage', 'rotterdam', 'amsterdam', 'nijmegen', 'netherlands', 'holland'],
  },
  {
    id: 'place-calgary',
    city: 'Calgary',
    province: 'Alberta',
    country: 'Canada',
    fullLabel: 'Calgary, Alberta, Canada',
    historicalName: 'Canadian Diaspora Hub',
    lat: 51.0447,
    lon: -114.0719,
    regionGroup: 'north-america',
    aliases: ['calgary', 'canada'],
  },
  {
    id: 'place-michigan',
    city: 'Grand Rapids',
    province: 'Michigan',
    country: 'United States',
    fullLabel: 'Michigan, United States',
    historicalName: 'US Indisch Diaspora Community',
    lat: 42.9634,
    lon: -85.6681,
    regionGroup: 'north-america',
    aliases: ['michigan', 'usa', 'united states', 'california'],
  },
];

/**
 * Replaces historical spelling "Menado" with "Manado" and enriches bare city strings
 * with standardized "City, Province, Country" formatting (e.g., "Manado, North Sulawesi, Indonesia").
 */
export function normalizePlaceName(raw?: string): string {
  if (!raw) return '';
  let text = raw.replace(/\bMenado\b/g, 'Manado').replace(/\bmenado\b/g, 'manado').trim();

  // Exact/common legacy region replacements
  const exactMap: Array<[RegExp, string]> = [
    [/^Manado(?:,\s*North Sulawesi(?:\s*\(N\.O\.I\.\))?|,\s*North Celebes|,\s*Celebes|,\s*N\.O\.I\.)?$/i, 'Manado, North Sulawesi, Indonesia'],
    [/^Minahasa(?:,\s*North Sulawesi(?:\s*\(N\.O\.I\.\))?|,\s*North Celebes|,\s*Celebes)?$/i, 'Minahasa, North Sulawesi, Indonesia'],
    [/^Tondano(?:,\s*North Sulawesi(?:\s*\(N\.O\.I\.\))?|,\s*Minahasa|,\s*North Celebes|,\s*Celebes)?$/i, 'Tondano, North Sulawesi, Indonesia'],
    [/^Kema(?:,\s*North Sulawesi(?:\s*\(N\.O\.I\.\))?|,\s*North Celebes|,\s*Minahasa|,\s*Celebes)?$/i, 'Kema, North Sulawesi, Indonesia'],
    [/^Tombariri(?:,\s*Minahasa|,\s*North Sulawesi)?$/i, 'Tombariri, North Sulawesi, Indonesia'],
    [/^Blitar(?:,\s*East Java)?$/i, 'Blitar, East Java, Indonesia'],
    [/^Malang(?:,\s*East Java)?$/i, 'Malang, East Java, Indonesia'],
    [/^Probolinggo(?:,\s*East Java)?$/i, 'Probolinggo, East Java, Indonesia'],
    [/^Surabaya(?:,\s*East Java)?$/i, 'Surabaya, East Java, Indonesia'],
    [/^Bandung(?:,\s*West Java)?$/i, 'Bandung, West Java, Indonesia'],
    [/^Batavia(?:,\s*Java)?$/i, 'Jakarta (Batavia), DKI Jakarta, Indonesia'],
    [/^Semarang(?:,\s*Central Java)?$/i, 'Semarang, Central Java, Indonesia'],
    [/^Makassar(?:,\s*South Sulawesi)?$/i, 'Makassar, South Sulawesi, Indonesia'],
    [/^Ternate(?:,\s*Moluccas|,\s*Maluku)?$/i, 'Ternate, North Maluku, Indonesia'],
    [/^Ambon(?:,\s*Moluccas|,\s*Maluku)?$/i, 'Ambon, Maluku, Indonesia'],
    [/^Groningen(?:,\s*Netherlands)?$/i, 'Groningen, Groningen, Netherlands'],
    [/^The Hague(?:,\s*Netherlands)?$/i, 'The Hague, South Holland, Netherlands'],
    [/^Rotterdam(?:,\s*Netherlands)?$/i, 'Rotterdam, South Holland, Netherlands'],
    [/^Amsterdam(?:,\s*Netherlands)?$/i, 'Amsterdam, North Holland, Netherlands'],
    [/^Calgary(?:,\s*Canada)?$/i, 'Calgary, Alberta, Canada'],
  ];

  for (const [pattern, replacement] of exactMap) {
    if (pattern.test(text)) {
      return replacement;
    }
  }

  // Inline replacements inside longer strings (like subtitles or multi-city strings)
  text = text
    .replace(/Manado,\s*North Sulawesi\s*\(N\.O\.I\.\)/gi, 'Manado, North Sulawesi, Indonesia')
    .replace(/Manado,\s*North Sulawesi(?!,\s*Indonesia)/gi, 'Manado, North Sulawesi, Indonesia')
    .replace(/Manado,\s*North Celebes/gi, 'Manado, North Sulawesi, Indonesia')
    .replace(/Tondano,\s*North Sulawesi(?!,\s*Indonesia)/gi, 'Tondano, North Sulawesi, Indonesia')
    .replace(/Kema,\s*North Sulawesi(?!,\s*Indonesia)/gi, 'Kema, North Sulawesi, Indonesia')
    .replace(/Kema,\s*North Celebes/gi, 'Kema, North Sulawesi, Indonesia')
    .replace(/Minahasa,\s*North Celebes/gi, 'Minahasa, North Sulawesi, Indonesia');

  return text;
}

/**
 * Resolves a free-form location string into coordinates + standardized GeoLocationInfo.
 */
export function resolveLocationCoordinates(placeText?: string): GeoLocationInfo | null {
  if (!placeText) return null;
  const lower = placeText.toLowerCase();

  for (const loc of KNOWN_ANCESTRAL_LOCATIONS) {
    if (loc.aliases.some((alias) => lower.includes(alias))) {
      return loc;
    }
  }

  // Default fallback if it explicitly mentions Indonesia or Sulawesi
  if (lower.includes('sulawesi') || lower.includes('celebes')) {
    return KNOWN_ANCESTRAL_LOCATIONS[0];
  }
  return null;
}

export const MIGRATION_ROUTE_SEGMENTS: Array<{
  fromId: string;
  toId: string;
  label: string;
  color: string;
}> = [
  { fromId: 'place-groningen', toId: 'place-manado', label: '1857 Kuitert Emigration (NL → Manado)', color: '#0b4a68' },
  { fromId: 'place-manado', toId: 'place-tondano', label: 'Minahasa Highlands Branch', color: '#73a922' },
  { fromId: 'place-manado', toId: 'place-kema', label: 'Eastern Minahasa Port Branch', color: '#73a922' },
  { fromId: 'place-manado', toId: 'place-malang', label: 'East Java State Railways & Estates', color: '#d97706' },
  { fromId: 'place-surabaya', toId: 'place-the-hague', label: 'Post-1949 MS Sibajak Repatriation', color: '#be123c' },
  { fromId: 'place-the-hague', toId: 'place-calgary', label: 'Canadian Diaspora', color: '#7c3aed' },
  { fromId: 'place-the-hague', toId: 'place-michigan', label: 'United States Diaspora', color: '#7c3aed' },
];
