export interface ExternalSearchConnector {
  id: string;
  name: string;
  badge: string;
  category: 'FamilySearch & Solutions' | 'Dutch East Indies & Indo' | 'European Archives' | 'Cemetery & Memorials';
  description: string;
  url: string;
  isFree: boolean;
  partnerInfo?: string;
}

/**
 * Builds dynamic pre-filled external research and archive query URLs for a specific person.
 * Connects directly to free tools featured in FamilySearch Solutions Gallery and regional archives.
 */
export function buildPersonSearchConnectors(person: {
  fullName: string;
  firstName?: string;
  lastName?: string;
  birthYear?: number;
  birthPlace?: string;
  deathYear?: number;
  deathPlace?: string;
  region?: string;
}): ExternalSearchConnector[] {
  const firstName = (person.firstName || person.fullName.split(' ')[0] || '').trim();
  const lastName = (person.lastName || person.fullName.split(' ').slice(1).join(' ') || '').trim();
  const fullName = person.fullName.trim();
  const birthYear = person.birthYear;
  const yearFrom = birthYear ? birthYear - 5 : undefined;
  const yearTo = birthYear ? birthYear + 5 : undefined;
  const location = person.birthPlace || person.region || 'Indonesia';

  // 1. FamilySearch Historical Records (Global free search)
  const fsParams = new URLSearchParams();
  if (firstName) fsParams.set('q.givenName', firstName);
  if (lastName) fsParams.set('q.surname', lastName);
  if (yearFrom !== undefined && yearTo !== undefined) {
    fsParams.set('q.birthLikeDate.from', String(yearFrom));
    fsParams.set('q.birthLikeDate.to', String(yearTo));
  }
  if (location) {
    fsParams.set('q.birthLikePlace', location);
  }
  const familySearchGlobalUrl = `https://www.familysearch.org/search/record/results?${fsParams.toString()}`;

  // 2. FamilySearch: Indonesia Civil Registration (1806–1997) Collection 1806941
  const fsIndoParams = new URLSearchParams();
  if (firstName) fsIndoParams.set('q.givenName', firstName);
  if (lastName) fsIndoParams.set('q.surname', lastName);
  fsIndoParams.set('f.collectionId', '1806941');
  const familySearchIndoUrl = `https://www.familysearch.org/search/record/results?${fsIndoParams.toString()}`;

  // 3. RecordSeek (Solutions Gallery Free Citation & Source Tagging Tool)
  const recordSeekUrl = `https://recordseek.com/?title=${encodeURIComponent(
    `${fullName} (${person.birthYear || 'Archival'}) — Family Archive`
  )}`;

  // 4. Delpher Colonial Newspapers (Dutch East Indies)
  // Search surname + (firstname OR Menado OR Manado OR Indië)
  const delpherQuery = `"${lastName}" AND ("${firstName}" OR Menado OR Manado OR Celebes)`;
  const delpherUrl = `https://www.delpher.nl/nl/kranten/results?query=${encodeURIComponent(delpherQuery)}`;

  // 5. OpenArchives.nl
  const openArchivesUrl = `https://www.openarch.nl/search.php?name=${encodeURIComponent(fullName)}`;

  // 6. WieWasWie (CBG Netherlands)
  const wieWasWieUrl = `https://www.wiewaswie.nl/en/search/?q=${encodeURIComponent(fullName)}`;

  // 7. Indische Genealogische Vereniging (IGV - Dutch East Indies & Minahasa)
  const igvUrl = `https://igv.nl/?s=${encodeURIComponent(lastName)}`;

  // 8. BillionGraves (FamilySearch Certified Partner)
  const bgParams = new URLSearchParams();
  if (firstName) bgParams.set('given_names', firstName);
  if (lastName) bgParams.set('family_names', lastName);
  const billionGravesUrl = `https://billiongraves.com/search/results?${bgParams.toString()}`;

  // 9. Find A Grave
  const fgParams = new URLSearchParams();
  if (firstName) fgParams.set('firstname', firstName);
  if (lastName) fgParams.set('lastname', lastName);
  if (birthYear) fgParams.set('birthyear', String(birthYear));
  const findAGraveUrl = `https://www.findagrave.com/memorial/search?${fgParams.toString()}`;

  return [
    {
      id: 'fs-global',
      name: 'FamilySearch Historical Records',
      badge: 'Free Official Database',
      category: 'FamilySearch & Solutions',
      description: `Search billions of indexed civil and church records globally for "${fullName}".`,
      url: familySearchGlobalUrl,
      isFree: true,
      partnerInfo: 'Official FamilySearch Core Database',
    },
    {
      id: 'fs-indo-civil',
      name: 'FamilySearch Indonesia Civil Registration (1806–1997)',
      badge: 'Collection 1806941',
      category: 'FamilySearch & Solutions',
      description: `Targeted search in Dutch East Indies & Indonesian colonial civil registrations (Batavia, Menado, Java, Ambon).`,
      url: familySearchIndoUrl,
      isFree: true,
      partnerInfo: 'Primary Historical Repository for Dutch East Indies',
    },
    {
      id: 'recordseek',
      name: 'RecordSeek — 1-Click Source Tagging',
      badge: 'Solutions Gallery Free Tool',
      category: 'FamilySearch & Solutions',
      description: `Clip web pages, Delpher clippings, and scans directly into FamilySearch without retyping.`,
      url: recordSeekUrl,
      isFree: true,
      partnerInfo: 'Featured FamilySearch Partner Extension',
    },
    {
      id: 'delpher-indies',
      name: 'Delpher Colonial Press & Gazette Notices',
      badge: 'Dutch Royal Library (KB)',
      category: 'Dutch East Indies & Indo',
      description: `Search historical East Indies newspapers (Java-Bode, Makassaarsche Courant) for births, marriages & obituaries.`,
      url: delpherUrl,
      isFree: true,
    },
    {
      id: 'igv-indies',
      name: 'Indische Genealogische Vereniging (IGV)',
      badge: 'Indies Lineage Archive',
      category: 'Dutch East Indies & Indo',
      description: `Authoritative journal indices (*De Indische Navorscher*) and colonial cemetery registries for European and Indo families.`,
      url: igvUrl,
      isFree: true,
    },
    {
      id: 'openarchives',
      name: 'OpenArchives.nl',
      badge: 'Open Data Aggregator',
      category: 'European Archives',
      description: `Aggregated open civil registries and passenger logs from 80+ Dutch and regional municipal archives.`,
      url: openArchivesUrl,
      isFree: true,
    },
    {
      id: 'wiewaswie',
      name: 'CBG WieWasWie',
      badge: 'Netherlands National Portal',
      category: 'European Archives',
      description: `Official Dutch Center for Family History civil records and repatriation files.`,
      url: wieWasWieUrl,
      isFree: true,
    },
    {
      id: 'billiongraves',
      name: 'BillionGraves Cemetery GPS',
      badge: 'Solutions Gallery Partner',
      category: 'Cemetery & Memorials',
      description: `World-wide GPS-tagged cemetery records and headstone photos integrated with FamilySearch.`,
      url: billionGravesUrl,
      isFree: true,
      partnerInfo: 'Certified FamilySearch API Partner',
    },
    {
      id: 'findagrave',
      name: 'Find A Grave Memorials',
      badge: 'Free Memorial Archive',
      category: 'Cemetery & Memorials',
      description: `Volunteer-transcribed cemetery plots, gravestones, and memorial notes across Indonesia and Europe.`,
      url: findAGraveUrl,
      isFree: true,
    },
  ];
}
