import { NextResponse } from 'next/server';

interface HeritagePlaceConfig {
  id: string;
  placeName: string;
  historicalName: string;
  country: string;
  wikipediaSlug: string;
  eraInTree: string;
  generationsPresent: string;
  familyConnection: string;
  localImage?: string;
}

const ANCESTRAL_PLACES: HeritagePlaceConfig[] = [
  {
    id: 'place-manado',
    placeName: 'Manado (North Sulawesi)',
    historicalName: 'Menado, Residentie Menado, N.O.I.',
    country: 'Indonesia',
    wikipediaSlug: 'Manado',
    eraInTree: '1805 – 1960s',
    generationsPresent: 'Gen I, II, III, IV',
    familyConnection:
      'Founding homeland of Jacob Lang & Maria Tampemawa (m. 1842); birthplace of all 7 Gen II children; Oude Kerkhof voor Europeanen burial site.',
    localImage: '/images/heritage/manado-harbor.jpg',
  },
  {
    id: 'place-minahasa',
    placeName: 'Minahasa Highlands & People',
    historicalName: 'Minahassa, Noord-Celebes',
    country: 'Indonesia',
    wikipediaSlug: 'Minahasan_people',
    eraInTree: '1810 – Present',
    generationsPresent: 'Gen I – IV+',
    familyConnection:
      'Indigenous maternal heritage via Maria Tampemawa and allied clans: Parera, Mamahit, Waworuntu, Warokka, Palendeng, Mogot, Ransun, Kalenkongan, Mononutu.',
    localImage: '/images/heritage/minahasa.jpg',
  },
  {
    id: 'place-tondano',
    placeName: 'Tondano & Lake Tondano',
    historicalName: 'Afdeeling Tondano, Celebes',
    country: 'Indonesia',
    wikipediaSlug: 'Tondano',
    eraInTree: '1865 – 1936',
    generationsPresent: 'Gen II, III',
    familyConnection:
      'Home of Sea Captain Joseph Lang (d. 1894) & Amelia Juliane Weintre; birthplace of Johan Marcus, Josephina, Hendrik Auguste, Maurits Joachim, and Philip Benjamin Lang.',
    localImage: '/images/heritage/lake-tondano.jpg',
  },
  {
    id: 'place-kema',
    placeName: 'Kema Port',
    historicalName: 'Kema, North Celebes',
    country: 'Indonesia',
    wikipediaSlug: 'Kema,_North_Sulawesi',
    eraInTree: '1858 – 1969',
    generationsPresent: 'Gen II, III, IV',
    familyConnection:
      'Historic eastern Minahasa port where Hendrik Lang (II-a) settled; birthplace of Jan Alexander Lang, Willem Albertus Lang, and Frans Albert Dirk Lang.',
  },
  {
    id: 'place-groningen',
    placeName: 'Groningen',
    historicalName: 'Stad Groningen, Koninkrijk der Nederlanden',
    country: 'Netherlands',
    wikipediaSlug: 'Groningen',
    eraInTree: '1821 – 1857',
    generationsPresent: 'Gen II (II-d), III',
    familyConnection:
      'Ancestral Dutch city of Jan Wolters Kuitert (b. 1821, son of silversmith Cornelius Kuitert), who emigrated to Menado in 1857 and married Elisabeth Lang.',
    localImage: '/images/heritage/groningen.jpg',
  },
  {
    id: 'place-blitar',
    placeName: 'Blitar & Malang (East Java)',
    historicalName: 'Oost-Java, Nederlandsch-Indië',
    country: 'Indonesia',
    wikipediaSlug: 'Blitar',
    eraInTree: '1899 – 1952',
    generationsPresent: 'Gen II, III, IV',
    familyConnection:
      'Final resting place of Amelia Juliane Lang-Weintre (d. 1912) and State Railways hub for Maurits Joachim Lang’s family in Malang & Probolinggo.',
  },
  {
    id: 'place-indo',
    placeName: 'Indo-European Heritage & Diaspora',
    historicalName: 'Indische Nederlanders (N.O.I. → NL / CA / USA)',
    country: 'Netherlands / Canada / USA',
    wikipediaSlug: 'Indo_people',
    eraInTree: '1805 – Present',
    generationsPresent: 'Gen I – IV+',
    familyConnection:
      'Post-1949 repatriation aboard vessels like MS Sibajak brought Lang & Kuitert descendants to The Hague, Amsterdam, Calgary (Canada), and Michigan (USA).',
    localImage: '/images/heritage/ms-sibajak.jpg',
  },
];

export async function GET() {
  const results = await Promise.all(
    ANCESTRAL_PLACES.map(async (place) => {
      try {
        const res = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
            place.wikipediaSlug
          )}`,
          {
            headers: { 'User-Agent': 'LangTampemawaFamilyArchive/1.0' },
            next: { revalidate: 86400 },
          }
        );
        if (!res.ok) {
          return {
            ...place,
            wikiTitle: place.placeName,
            extract: place.familyConnection,
            coordinates: null,
            wikipediaUrl: `https://en.wikipedia.org/wiki/${place.wikipediaSlug}`,
            thumbnail: place.localImage || null,
          };
        }
        const json = await res.json();
        return {
          ...place,
          wikiTitle: String(json.title || place.placeName),
          description: String(json.description || ''),
          extract: String(json.extract || place.familyConnection),
          coordinates: json.coordinates
            ? { lat: Number(json.coordinates.lat), lon: Number(json.coordinates.lon) }
            : null,
          wikipediaUrl:
            json.content_urls?.desktop?.page ||
            `https://en.wikipedia.org/wiki/${place.wikipediaSlug}`,
          thumbnail: place.localImage || json.thumbnail?.source || null,
        };
      } catch {
        return {
          ...place,
          wikiTitle: place.placeName,
          extract: place.familyConnection,
          coordinates: null,
          wikipediaUrl: `https://en.wikipedia.org/wiki/${place.wikipediaSlug}`,
          thumbnail: place.localImage || null,
        };
      }
    })
  );

  return NextResponse.json({
    sourceApi: 'Wikipedia REST API v1 (en.wikipedia.org/api/rest_v1)',
    places: results,
    fetchedAt: new Date().toISOString(),
  });
}
