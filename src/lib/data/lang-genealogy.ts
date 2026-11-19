export interface TreeCollaborator {
  email: string;
  uid?: string;
  displayName?: string;
  role: 'editor';
  invitedAt: string;
  invitedBy: string;
}

export interface FamilyTreeGroupRecord {
  id: string;
  name: string;
  subtitle: string;
  region: string;
  description?: string;
  sourceLabel?: string;
  sourceUrl?: string;
  accentColor?: 'maritime' | 'emerald' | 'amber' | 'rose';
  createdAt: string;
  ownerId?: string;
  ownerEmail?: string;
  visibility?: 'public' | 'private';
  collaborators?: TreeCollaborator[];
}

export const DEFAULT_TREE_ID = 'lang-tampemawa';

export const DEFAULT_FAMILY_TREE_GROUP: FamilyTreeGroupRecord = {
  id: DEFAULT_TREE_ID,
  name: 'Jacob Lang & Maria Tampemawa Family',
  subtitle: 'Parenteel · Est. 1805 Menado, North Sulawesi',
  region: 'Menado, North Sulawesi (N.O.I.)',
  description:
    'Four generations of Indo-Minahasan lineage spanning Menado, Tondano, Kema, Java, the Netherlands, Canada, and the USA.',
  sourceLabel: 'brouwertree.com/langgene.html',
  sourceUrl: 'https://www.brouwertree.com/langgene.html',
  accentColor: 'maritime',
  createdAt: '2026-01-01T00:00:00.000Z',
  ownerId: 'system',
  visibility: 'public',
  collaborators: [],
};

export interface FamilyMemberRecord {
  id: string;
  treeId?: string;
  code: string; // e.g., "I", "II-a", "III-i", "IV-ad"
  firstName: string;
  lastName: string;
  fullName: string;
  nickname?: string;
  gender: 'male' | 'female' | 'unknown';
  generation: number; // 1, 2, 3, 4
  branch: 'root' | 'hendrik' | 'joseph' | 'carolina' | 'elisabeth';
  parentId: string | null; // primary Lang-line parent
  motherName?: string;
  fatherName?: string;
  birthDate?: string;
  birthYear?: number;
  birthPlace?: string;
  deathDate?: string;
  deathYear?: number;
  deathPlace?: string;
  burialPlace?: string;
  occupation?: string;
  religion?: string;
  heritageTags: string[]; // e.g. ["Minahasan", "Dutch East Indies", "VOC-Era European"]
  region: string; // e.g. "Menado, North Sulawesi (N.O.I.)"
  photoUrl?: string;
  bio: string;
  spouses: SpouseRecord[];
  sources: string[];
  sourceUrl: string;
  isFeatured?: boolean;
}

export interface SpouseRecord {
  id: string;
  name: string;
  surname: string;
  marriageOrder: number;
  marriageDate?: string;
  marriagePlace?: string;
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  occupation?: string;
  heritage?: string;
  photoUrl?: string;
  notes?: string;
}

export interface ArchivalSourceRecord {
  id: string;
  category: 'Civil Registry' | 'VOC Voyage' | 'Gravestone' | 'Passenger List' | 'Directory' | 'War Grave' | 'Naturalization';
  year: number;
  dateLabel: string;
  title: string;
  personNames: string[];
  location: string;
  summary: string;
  sourceCitation: string;
  memberId?: string;
  pageRef: string;
}

export interface HeritageOriginSeed {
  id: string;
  surname: string;
  heritageGroup: 'Minahasan (North Sulawesi)' | 'Dutch / Germanic' | 'Indo-European (N.O.I.)' | 'Moluccan-Portuguese' | 'English-Indisch';
  ancestralRegion: string;
  firstAppearanceGen: string;
  firstAppearanceYear: number;
  notableMembers: string;
  historicalContext: string;
  wikipediaSlug: string;
}

export const INITIAL_MEMBERS: FamilyMemberRecord[] = [
  // ==================== GENERATION I ====================
  {
    id: 'I',
    code: 'I',
    firstName: 'Jacob',
    lastName: 'Lang',
    fullName: 'Jacob Lang',
    gender: 'male',
    generation: 1,
    branch: 'root',
    parentId: null,
    birthDate: 'ca. 1805',
    birthYear: 1805,
    birthPlace: 'Menado, Celebes (N.O.I.)',
    deathDate: '1 December 1845',
    deathYear: 1845,
    deathPlace: 'Menado, Celebes (N.O.I.)',
    occupation: 'Early European Resident of Menado',
    heritageTags: ['Dutch East Indies', 'European-Indisch', 'Menado Pioneer', 'Minahasa'],
    region: 'Menado, North Sulawesi',
    photoUrl: '/images/portraits/jacob-lang.jpg',
    bio: 'Patriarch of the Lang–Tampemawa lineage of Menado, North Celebes (North Sulawesi). Born around 1805 in Menado, Jacob married Maria Tampemawa on 12 May 1842 in Menado, formally legitimizing their growing family in the colonial Civil Registry (Burgerlijke Stand). He passed away on 1 December 1845 at approximately age 40, leaving four surviving branches that spread across Minahasa, Java, Sumatra, the Netherlands, Canada, and the United States.',
    spouses: [
      {
        id: 'sp-I-1',
        name: 'Maria Tampemawa',
        surname: 'Tampemawa',
        marriageOrder: 1,
        marriageDate: '12 May 1842',
        marriagePlace: 'Menado, Celebes (N.O.I.)',
        birthDate: 'ca. 1810',
        birthPlace: 'Minahasa, North Celebes',
        heritage: 'Minahasan (North Sulawesi)',
        photoUrl: '/images/portraits/maria-tampemawa.jpg',
        notes: 'Also spelled Tampamawah / Tampawawa in the 1843 Almanak van Nederlandsch-Indië and the Kuitert family chronicle. Matriarch of the Minahasan-Dutch Lang dynasty.'
      }
    ],
    sources: [
      'Almanak van Nederlandsch-Indië, 1843, p. A 258 (Voltrokken huwelijken, Menado 12 Mei 1842)',
      'Regerings-Almanak van Nederlandsch-Indië, 1847, p. A 387 (Aangiften van overlijden, Menado 1 Dec 1845)',
      'Undated Kuitert family article citing Elizabeth Lang, daughter of Jacob Lang and Maria Tampamawah'
    ],
    sourceUrl: 'https://www.brouwertree.com/langgene.html#1',
    isFeatured: true
  },

  // ==================== GENERATION II ====================
  {
    id: 'II-a',
    code: 'II-a',
    firstName: 'Hendrik',
    lastName: 'Lang',
    fullName: 'Hendrik Lang',
    gender: 'male',
    generation: 2,
    branch: 'hendrik',
    parentId: 'I',
    fatherName: 'Jacob Lang',
    motherName: 'Maria Tampemawa',
    birthDate: '16 September 1833',
    birthYear: 1833,
    birthPlace: 'Menado, Celebes (N.O.I.)',
    deathDate: 'after 1895',
    deathYear: 1896,
    deathPlace: 'Kema, North Celebes',
    occupation: 'Registered European Inhabitant of Menado & Kema',
    heritageTags: ['Indo-Minahasan', 'Menado', 'Kema', 'Dutch East Indies'],
    region: 'Kema & Menado, North Sulawesi',
    photoUrl: '/images/portraits/hendrik-lang.jpg',
    bio: 'Eldest son of Jacob Lang and Maria Tampemawa. Listed among the European residents of Menado (1863–1880) and later residing in the historic port town of Kema (1894–1895). Founder of the Kema–Menado branch through marriages with Gritjie Engelen and Maria Louise Uijtenbroeck.',
    spouses: [
      {
        id: 'sp-IIa-1',
        name: 'Gritjie Engelen',
        surname: 'Engelen',
        marriageOrder: 1,
        marriageDate: 'ca. 1858',
        marriagePlace: 'Menado / Kema',
        birthDate: 'ca. 1835',
        deathDate: 'ca. 1875',
        heritage: 'Dutch-Indisch (Engelen family of Kema & Batavia)',
        notes: 'Also remembered as Oma Engelen; mother of Jan Alexander, Willem Albertus, Wilhelmina, and Josefien.'
      },
      {
        id: 'sp-IIa-2',
        name: 'Maria Louise Uijtenbroeck',
        surname: 'Uijtenbroeck',
        marriageOrder: 2,
        marriageDate: 'ca. 1875',
        marriagePlace: 'Menado / Kema',
        birthDate: 'ca. 1845',
        heritage: 'Dutch-Indisch (Uitenbroek lineage from Nijmegen / Ternate VOC)',
        notes: 'Mother of Bernardus Jacob Lang (1878–1960).'
      }
    ],
    sources: [
      'Almanak van Nederlandsch-Indië 1815–1942: Naamlijst der Europeesche Inwoners, Menado (1863–1880)',
      'Almanak van Nederlandsch-Indië 1895: Naamlijst der Europeesche Inwoners, Kema',
      'Family correspondence L.M. Engelen (October 2009)'
    ],
    sourceUrl: 'https://www.brouwertree.com/langgene.html#2a',
    isFeatured: true
  },
  {
    id: 'II-b',
    code: 'II-b',
    firstName: 'Joseph',
    lastName: 'Lang',
    fullName: 'Joseph Lang',
    gender: 'male',
    generation: 2,
    branch: 'joseph',
    parentId: 'I',
    fatherName: 'Jacob Lang',
    motherName: 'Maria Tampemawa',
    birthDate: '1 February 1835',
    birthYear: 1835,
    birthPlace: 'Menado, Celebes (N.O.I.)',
    deathDate: '17 April 1894',
    deathYear: 1894,
    deathPlace: 'Tondano, North Celebes',
    occupation: 'Sea Captain (Zeekapitein) & Merchant (Koopman)',
    heritageTags: ['Indo-Minahasan', 'Maritime Captain', 'Tondano', 'Global Diaspora'],
    region: 'Menado & Tondano, North Sulawesi',
    photoUrl: '/images/portraits/joseph-lang.jpg',
    bio: 'Second son of Jacob Lang and Maria Tampemawa. A prominent sea captain (zeekapitein) and merchant (koopman) in Menado and Tondano. Married Amelia Juliane Weintre in 1865; together they raised a large family of 8 sons and 2+ daughters whose descendants became State Railway architects on Java and later settled in the Netherlands, Canada, and the USA.',
    spouses: [
      {
        id: 'sp-IIb-1',
        name: 'Amelia Juliane Weintre',
        surname: 'Weintre',
        marriageOrder: 1,
        marriageDate: '6 March 1865',
        marriagePlace: 'Menado, Celebes (N.O.I.)',
        birthDate: '22 May 1846',
        birthPlace: 'Menado, Celebes',
        deathDate: '25 April 1912',
        deathPlace: 'Blitar, East Java',
        heritage: 'English-Indisch / Ternate-Menado Weintre lineage',
        photoUrl: '/images/portraits/amelia-weintre.jpg',
        notes: 'According to great-grandson Ben Lang, Amelia held English nationality. Buried at Blitar Cemetery, East Java, plot nr. 287.'
      }
    ],
    sources: [
      'Almanak van Nederlandsch-Indië, 1866, p. 22 (Marriage Menado, 6 March 1865)',
      'Almanak van Nederlandsch-Indië, 1895, p. 446 (Death Tondano, 17 April 1894)',
      'Gravestone Blitar Cemetery, East Java, nr. 287 (A.J. Lang-Weintre)'
    ],
    sourceUrl: 'https://www.brouwertree.com/langgene.html#2b',
    isFeatured: true
  },
  {
    id: 'II-c',
    code: 'II-c',
    firstName: 'Carolina',
    lastName: 'Lang',
    fullName: 'Carolina Lang',
    gender: 'female',
    generation: 2,
    branch: 'carolina',
    parentId: 'I',
    fatherName: 'Jacob Lang',
    motherName: 'Maria Tampemawa',
    birthDate: '31 January 1836',
    birthYear: 1836,
    birthPlace: 'Menado, Celebes (N.O.I.)',
    deathDate: '8 May 1872',
    deathYear: 1872,
    deathPlace: 'Menado, Celebes (N.O.I.)',
    occupation: 'Wife of District Chief (Majoor) of Tombariri',
    heritageTags: ['Indo-Minahasan', 'Tombariri Nobility', 'Parera-Mamahit-Waworuntu'],
    region: 'Tombariri & Menado, North Sulawesi',
    photoUrl: '/images/portraits/carolina-lang.jpg',
    bio: 'Eldest daughter of Jacob Lang and Maria Tampemawa. Married Johannis Marcus Parera, Roman Catholic District Chief (Majoor) of the IVth District Tombariri in Minahasa. Though she passed away young at age 36, her daughters married into the prominent Minahasan Mamahit, Waworuntu (Waworoentoe), and Warokka clans.',
    spouses: [
      {
        id: 'sp-IIc-1',
        name: 'Johannis Marcus Parera',
        surname: 'Parera',
        marriageOrder: 1,
        marriageDate: '29 March 1865',
        marriagePlace: 'Menado, Celebes (N.O.I.)',
        birthDate: '15 October 1823',
        deathDate: '14 August 1898',
        deathPlace: 'Menado',
        occupation: 'District Chief (Majoor) of IVth District Tombariri',
        heritage: 'Moluccan-Portuguese / Minahasan (son of Johan Frederik Parera & Adriana Andries)',
        photoUrl: '/images/portraits/johannis-parera.jpg',
        notes: 'Married 4 times: (1) Barina Kaligis, (2) Maria Lasut, (3) Carolina Lang, (4) Marthina Tambajong.'
      }
    ],
    sources: [
      'Almanak van Nederlandsch-Indië, 1866, p. 22 (Marriage Menado, 29 March 1865)',
      'Almanak van Nederlandsch-Indië, 1899, p. 472 (Death Johannis Marcus Parera, 14 Aug 1898)'
    ],
    sourceUrl: 'https://www.brouwertree.com/langgene.html#2c',
    isFeatured: true
  },
  {
    id: 'II-d',
    code: 'II-d',
    firstName: 'Elisabeth',
    lastName: 'Lang',
    fullName: 'Elisabeth Lang',
    gender: 'female',
    generation: 2,
    branch: 'elisabeth',
    parentId: 'I',
    fatherName: 'Jacob Lang',
    motherName: 'Maria Tampemawa',
    birthDate: '24 December 1838',
    birthYear: 1838,
    birthPlace: 'Menado, Celebes (N.O.I.)',
    deathDate: '12 December 1912',
    deathYear: 1912,
    deathPlace: 'Menado, Celebes (N.O.I.)',
    occupation: 'Matriarch & Plantation Family Co-Founder (Mukupa)',
    heritageTags: ['Indo-Minahasan', 'Groningen-Menado Bridge', 'Waterstaat & Spoorwegen'],
    region: 'Menado, Gorontalo, Bondowoso & Groningen',
    photoUrl: '/images/portraits/elisabeth-lang.jpg',
    bio: 'Daughter of Jacob Lang and Maria Tampemawa. Married Dutch master carpenter and 1st Class Public Works (Waterstaat) Overseer Jan Wolters Kuitert from Groningen. Together they lived across Menado, Gorontalo, Bondowoso, Makassar, and Madiun, traveled to the Netherlands in 1881–1882 with their five children, and owned the 27-bouw Mukupa nutmeg plantation near Menado.',
    spouses: [
      {
        id: 'sp-IId-1',
        name: 'Jan Wolters Kuitert',
        surname: 'Kuitert',
        marriageOrder: 1,
        marriageDate: '23 December 1863',
        marriagePlace: 'Menado, Celebes (N.O.I.)',
        birthDate: '19 July 1821',
        birthPlace: 'Groningen, Netherlands',
        deathDate: '21 March 1896',
        deathPlace: 'Menado, buried Oude Kerkhof voor Europeanen nr. 124',
        occupation: 'Master Carpenter, Fire Chief (1861), 1st Class Waterstaat Overseer & Nutmeg Planter (Mukupa)',
        heritage: 'Dutch (Groningen; son of silversmith Cornelius Berents Kuitert & Jacoba Wolters)',
        photoUrl: '/images/portraits/jan-wolters-kuitert.jpg',
        notes: 'Widower of Hinderkien de Jonge (d. 1857); sailed from Groningen to Menado on 11 August 1857 with his children Frouke and Cornelius.'
      }
    ],
    sources: [
      'Almanak van Nederlandsch-Indië, 1865, p. 21 (Marriage Menado, 23 Dec 1863)',
      'Almanak van Nederlandsch-Indië, 1896, p. 377 (Particuliere Landerijen: Mukupa nutmeg estate, 27 bouws)',
      'GenLias Groningen Birth/Marriage/Death Records (1821–1857)',
      'Oude Kerkhof voor Europeanen Menado, Gravestone nr. 124'
    ],
    sourceUrl: 'https://www.brouwertree.com/langgene.html#2d',
    isFeatured: true
  },
  {
    id: 'II-e',
    code: 'II-e',
    firstName: 'Louisa',
    lastName: 'Lang',
    fullName: 'Louisa Lang',
    gender: 'female',
    generation: 2,
    branch: 'root',
    parentId: 'I',
    fatherName: 'Jacob Lang',
    motherName: 'Maria Tampemawa',
    birthDate: '12 November 1840',
    birthYear: 1840,
    birthPlace: 'Menado, Celebes (N.O.I.)',
    deathDate: '3 April 1842',
    deathYear: 1842,
    deathPlace: 'Menado, Celebes (N.O.I.)',
    heritageTags: ['Indo-Minahasan', 'Menado'],
    region: 'Menado, North Sulawesi',
    bio: 'Fifth child of Jacob Lang and Maria Tampemawa; passed away in infancy in Menado at age 1 year and 4 months.',
    spouses: [],
    sources: ['BrouwerTree Parenteel Jacob Lang & Maria Tampemawa'],
    sourceUrl: 'https://www.brouwertree.com/langgene.html#1'
  },
  {
    id: 'II-f',
    code: 'II-f',
    firstName: 'Jacob Philip',
    lastName: 'Lang',
    fullName: 'Jacob Philip Lang',
    gender: 'male',
    generation: 2,
    branch: 'root',
    parentId: 'I',
    fatherName: 'Jacob Lang',
    motherName: 'Maria Tampemawa',
    birthDate: '13 January 1843',
    birthYear: 1843,
    birthPlace: 'Menado, Celebes (N.O.I.)',
    deathDate: '23 February 1846',
    deathYear: 1846,
    deathPlace: 'Menado, Celebes (N.O.I.)',
    heritageTags: ['Indo-Minahasan', 'Menado'],
    region: 'Menado, North Sulawesi',
    bio: 'Sixth child of Jacob Lang and Maria Tampemawa; passed away in early childhood at age 3, just two months after his father.',
    spouses: [],
    sources: ['Regerings-Almanak van Nederlandsch-Indië, 1847, p. A 387'],
    sourceUrl: 'https://www.brouwertree.com/langgene.html#1'
  },
  {
    id: 'II-g',
    code: 'II-g',
    firstName: 'Johanna Catharina',
    lastName: 'Lang',
    fullName: 'Johanna Catharina Lang',
    gender: 'female',
    generation: 2,
    branch: 'root',
    parentId: 'I',
    fatherName: 'Jacob Lang',
    motherName: 'Maria Tampemawa',
    birthDate: '22 November 1844',
    birthYear: 1844,
    birthPlace: 'Menado, Celebes (N.O.I.)',
    deathDate: '23 March 1846',
    deathYear: 1846,
    deathPlace: 'Menado, Celebes (N.O.I.)',
    heritageTags: ['Indo-Minahasan', 'Menado'],
    region: 'Menado, North Sulawesi',
    bio: 'Youngest child of Jacob Lang and Maria Tampemawa; passed away in infancy in Menado at age 1 year and 4 months.',
    spouses: [],
    sources: ['Regerings-Almanak van Nederlandsch-Indië, 1847, p. A 387'],
    sourceUrl: 'https://www.brouwertree.com/langgene.html#1'
  },

  // ==================== GENERATION III (Branch II-a: Hendrik Lang) ====================
  {
    id: 'III-a',
    code: 'III-a',
    firstName: 'Jan Alexander',
    lastName: 'Lang',
    fullName: 'Jan Alexander Lang',
    gender: 'male',
    generation: 3,
    branch: 'hendrik',
    parentId: 'II-a',
    fatherName: 'Hendrik Lang',
    motherName: 'Gritjie Engelen',
    birthDate: '28 December 1859',
    birthYear: 1859,
    birthPlace: 'Kema, North Celebes',
    deathDate: '15 December 1906',
    deathYear: 1906,
    deathPlace: 'Menado, North Celebes',
    burialPlace: 'Het Oude Kerkhof voor Europeanen, Menado (nr. 43)',
    occupation: 'Landraad Bailiff (Gorontalo), Nutmeg Planter (Tateli), Controleur Clerk',
    heritageTags: ['Indo-Minahasan', 'Kema', 'Gorontalo', 'Tateli Estate'],
    region: 'Kema, Gorontalo & Menado',
    bio: 'Eldest son of Hendrik Lang and Gritjie Engelen. Served as Extraordinary Bailiff at the Gorontalo District Court (1883–1885), owned the 26-bouw Tateli nutmeg estate near Menado (1895), and worked as Clerk to the Controleur at Palehleh, Menado (1900).',
    spouses: [
      {
        id: 'sp-IIIa-1',
        name: 'Helena Laseduw',
        surname: 'Laseduw',
        marriageOrder: 1,
        marriageDate: '1885',
        marriagePlace: 'Kema, North Celebes',
        heritage: 'Minahasan'
      },
      {
        id: 'sp-IIIa-2',
        name: 'Maria Carolina van Slooten',
        surname: 'van Slooten',
        marriageOrder: 2,
        marriageDate: '8 June 1898',
        marriagePlace: 'Menado',
        birthDate: '17 December 1871',
        birthPlace: 'Menado',
        deathDate: '16 September 1943',
        heritage: 'Dutch-Indisch'
      }
    ],
    sources: [
      'Almanak van Nederlandsch-Indië 1884–1885, p. 99 (Landraad te Gorontalo)',
      'Almanak van Nederlandsch-Indië 1896, p. 377 (Tateli nutmeg plantation)',
      'Oude Kerkhof voor Europeanen Menado, nr. 43'
    ],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3a'
  },
  {
    id: 'III-b',
    code: 'III-b',
    firstName: 'Willem Albertus',
    lastName: 'Lang',
    fullName: 'Willem Albertus Lang',
    nickname: 'Willem Alexander',
    gender: 'male',
    generation: 3,
    branch: 'hendrik',
    parentId: 'II-a',
    fatherName: 'Hendrik Lang',
    motherName: 'Gritjie Engelen',
    birthDate: '30 May 1862',
    birthYear: 1862,
    birthPlace: 'Kema, North Celebes',
    deathDate: '26 March 1909',
    deathYear: 1909,
    deathPlace: 'Kema, North Celebes',
    burialPlace: 'Menado (family tomb with Josephina Davis)',
    occupation: 'Bailiff at Kema (1885) & Clerk at Menado Residency Office',
    heritageTags: ['Indo-Minahasan', 'Kema', 'English-Dutch Connection'],
    region: 'Kema & Menado, North Sulawesi',
    bio: 'Second son of Hendrik Lang and Gritjie Engelen. Served as civil bailiff in Kema and clerk at the Residentiekantoor in Menado. Married Josephina Elisabeth Davis (daughter of William George Davis and Emilia Josephina Waersegers).',
    spouses: [
      {
        id: 'sp-IIIb-1',
        name: 'Josephina Elisabeth Davis',
        surname: 'Davis',
        marriageOrder: 1,
        marriageDate: '1886',
        marriagePlace: 'Kema',
        birthDate: '10 April 1870',
        birthPlace: 'Kema',
        deathDate: '23 December 1935',
        deathPlace: 'Menado',
        heritage: 'British-Dutch Indisch'
      }
    ],
    sources: [
      'Almanak van Nederlandsch-Indië 1888, p. 247 (Marriage Kema 1886)',
      'Almanak van Nederlandsch-Indië 1901, p. 357 (Klerk Residentiekantoor Menado)'
    ],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3b'
  },
  {
    id: 'III-c',
    code: 'III-c',
    firstName: 'Wilhelmina A.',
    lastName: 'Lang',
    fullName: 'Wilhelmina A. Lang',
    gender: 'female',
    generation: 3,
    branch: 'hendrik',
    parentId: 'II-a',
    fatherName: 'Hendrik Lang',
    motherName: 'Gritjie Engelen',
    birthDate: 'ca. 1865',
    birthYear: 1865,
    birthPlace: 'Kema / Menado',
    heritageTags: ['Indo-Minahasan', 'Winter Family', 'Kema'],
    region: 'Kema & Menado, North Sulawesi',
    bio: 'Daughter of Hendrik Lang and Gritjie Engelen. Married Johan Carel (Karel) Winter of Kema; their children connected the family to the van Slooten, Lefrandt, and Bendsneijder families.',
    spouses: [
      {
        id: 'sp-IIIc-1',
        name: 'Johan Carel (Karel) Winter',
        surname: 'Winter',
        marriageOrder: 1,
        marriageDate: 'ca. 1882',
        birthDate: '24 November 1855',
        birthPlace: 'Kema',
        deathDate: '5 February 1934',
        deathPlace: 'Menado',
        heritage: 'Dutch-Indisch (Winter family of Kema)'
      }
    ],
    sources: ['Burgerlijke Stand Menado 1934 nr. 1', 'Parenteel Winter'],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3c'
  },
  {
    id: 'III-d',
    code: 'III-d',
    firstName: 'Josefien',
    lastName: 'Lang',
    fullName: 'Josefien Lang',
    gender: 'female',
    generation: 3,
    branch: 'hendrik',
    parentId: 'II-a',
    fatherName: 'Hendrik Lang',
    motherName: 'Gritjie Engelen',
    birthDate: 'ca. 1870',
    birthYear: 1870,
    birthPlace: 'Menado (probable)',
    heritageTags: ['Indo-Minahasan', 'Menado'],
    region: 'Menado, North Sulawesi',
    bio: 'Daughter of Hendrik Lang and Gritjie Engelen. Married Alexander; their descendants carried the combined Alexander Lang surname in Manado and Kema.',
    spouses: [
      {
        id: 'sp-IIId-1',
        name: 'Alexander',
        surname: 'Alexander',
        marriageOrder: 1,
        birthDate: 'ca. 1870',
        birthPlace: 'Menado (probable)'
      }
    ],
    sources: ['BrouwerTree Lang Parenteel Generation III-d'],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3d'
  },
  {
    id: 'III-e',
    code: 'III-e',
    firstName: 'Bernardus Jacob',
    lastName: 'Lang',
    fullName: 'Bernardus Jacob Lang',
    gender: 'male',
    generation: 3,
    branch: 'hendrik',
    parentId: 'II-a',
    fatherName: 'Hendrik Lang',
    motherName: 'Maria Louise Uijtenbroeck',
    birthDate: '26 August 1878',
    birthYear: 1878,
    birthPlace: 'Menado, North Celebes',
    deathDate: '3 February 1960',
    deathYear: 1960,
    deathPlace: 'Minahasa, Indonesia',
    heritageTags: ['Indo-Minahasan', 'Uijtenbroeck Line', 'Palendeng', 'Luasunaung'],
    region: 'Menado, North Sulawesi',
    bio: 'Son of Hendrik Lang and his second wife Maria Louise Uijtenbroeck. Lived 81 years across the colonial transition into Indonesian independence, founding a large Minahasan branch through Barina Palendeng and Maria Luasunaung.',
    spouses: [
      {
        id: 'sp-IIIe-1',
        name: 'Barina Palendeng',
        surname: 'Palendeng',
        marriageOrder: 1,
        birthDate: '12 November 1879',
        deathDate: '16 February 1943',
        heritage: 'Minahasan'
      },
      {
        id: 'sp-IIIe-2',
        name: 'Maria Luasunaung',
        surname: 'Luasunaung',
        marriageOrder: 2,
        birthDate: '10 May 1925',
        heritage: 'Minahasan / Sangihe-Talaud'
      }
    ],
    sources: [
      'Almanak van Nederlandsch-Indië 1896–1898 (Naamlijst Menado)',
      'Family photographic archive of Sergey Lang (2013)'
    ],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3e'
  },

  // ==================== GENERATION III (Branch II-b: Joseph Lang) ====================
  {
    id: 'III-f',
    code: 'III-f',
    firstName: 'Louis Jacob',
    lastName: 'Lang',
    fullName: 'Louis Jacob Lang',
    gender: 'male',
    generation: 3,
    branch: 'joseph',
    parentId: 'II-b',
    fatherName: 'Joseph Lang',
    motherName: 'Amelia Juliane Weintre',
    birthDate: '28 January 1866',
    birthYear: 1866,
    birthPlace: 'Menado, Celebes (N.O.I.)',
    occupation: 'Administrator at Wanata-Menado (1901)',
    heritageTags: ['Indo-Minahasan', 'Wanata-Menado', 'Weintre Line'],
    region: 'Wanata-Menado, North Sulawesi',
    bio: 'Eldest son of Captain Joseph Lang and Amelia Juliane Weintre. Worked as estate administrator in Wanata-Menado and fathered eleven children in North Sulawesi.',
    spouses: [
      {
        id: 'sp-IIIf-1',
        name: 'N.N.',
        surname: 'Unknown',
        marriageOrder: 1
      },
      {
        id: 'sp-IIIf-2',
        name: 'Amercina Rambuhani',
        surname: 'Rambuhani',
        marriageOrder: 2,
        birthDate: '1901',
        deathDate: '1979',
        heritage: 'Minahasan / Indonesian'
      }
    ],
    sources: ['Almanak van Nederlandsch-Indië, 1901, p. 357 (Administrateur, Wanata-Menado)'],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3f'
  },
  {
    id: 'III-g',
    code: 'III-g',
    firstName: 'Johan Marcus',
    lastName: 'Lang',
    fullName: 'Johan Marcus Lang',
    gender: 'male',
    generation: 3,
    branch: 'joseph',
    parentId: 'II-b',
    fatherName: 'Joseph Lang',
    motherName: 'Amelia Juliane Weintre',
    birthDate: '5 February 1868',
    birthYear: 1868,
    birthPlace: 'Tondano, Celebes (N.O.I.)',
    deathDate: '17 June 1931',
    deathYear: 1931,
    deathPlace: 'Menado, Celebes',
    occupation: 'Private Citizen (Particulier) in Tondano & Amoerang',
    heritageTags: ['Indo-Minahasan', 'Tondano', 'Amoerang', 'Mogot Clan'],
    region: 'Tondano, Amoerang & Menado',
    bio: 'Second son of Joseph Lang and Amelia Juliane Weintre. Lived in Tondano and Amoerang; married Constans (Tatie) Mogot of Remboken in 1907. Their descendants include KNIL soldiers and PTT civil servants in Arnhem, Netherlands.',
    spouses: [
      {
        id: 'sp-IIIg-1',
        name: 'Constans (Tatie) Mogot',
        surname: 'Mogot',
        marriageOrder: 1,
        marriageDate: '12 June 1907',
        marriagePlace: 'Amoerang, Celebes',
        birthDate: '14 March 1875',
        birthPlace: 'Remboken, Celebes',
        deathDate: '29 February 1936',
        deathPlace: 'Tomohon, Celebes',
        heritage: 'Minahasan (Mogot family of Remboken)'
      }
    ],
    sources: [
      'Almanak van Nederlandsch-Indië 1869, p. 73 (Birth Tondano)',
      'Almanak van Nederlandsch-Indië 1908, p. 28 (Marriage Amoerang 12 June 1907)'
    ],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3g'
  },
  {
    id: 'III-h',
    code: 'III-h',
    firstName: 'Josephina Julienne',
    lastName: 'Lang',
    fullName: 'Josephina Julienne Lang',
    gender: 'female',
    generation: 3,
    branch: 'joseph',
    parentId: 'II-b',
    fatherName: 'Joseph Lang',
    motherName: 'Amelia Juliane Weintre',
    birthDate: '1 January 1870',
    birthYear: 1870,
    birthPlace: 'Tondano, Celebes (N.O.I.)',
    deathDate: '8 February 1909',
    deathYear: 1909,
    deathPlace: 'Menado, Celebes',
    burialPlace: 'Het Oude Kerkhof voor Europeanen, Menado',
    heritageTags: ['Indo-Minahasan', 'Tondano', 'Weijdemuller Mining Line'],
    region: 'Tondano & Menado',
    bio: 'Eldest daughter of Joseph Lang and Amelia Juliane Weintre. Married Petrus Cornelis Jacobus Weijdemuller, supervisor at the Totok gold mining company in Tondano (son of Joost Weijdemuller and Wilhelmina Waworuntu).',
    spouses: [
      {
        id: 'sp-IIIh-1',
        name: 'Petrus Cornelis Jacobus Weijdemuller',
        surname: 'Weijdemuller',
        marriageOrder: 1,
        marriageDate: '18 January 1894',
        marriagePlace: 'Tondano',
        birthDate: '27 April 1866',
        birthPlace: 'Tondano',
        deathDate: '10 May 1939',
        deathPlace: 'Menado',
        occupation: 'Mining Supervisor, Mijnbouw Mij "Totok" (1898)',
        heritage: 'Dutch-Minahasan (Weijdemuller–Waworuntu)'
      }
    ],
    sources: ['BrouwerTree Lang Parenteel III-h', 'Email archive L.M. Engelen (Oct 2009)'],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3h'
  },
  {
    id: 'III-h2',
    code: 'II-b.4',
    firstName: 'Hendrik Auguste',
    lastName: 'Lang',
    fullName: 'Hendrik Auguste Lang',
    gender: 'male',
    generation: 3,
    branch: 'joseph',
    parentId: 'II-b',
    fatherName: 'Joseph Lang',
    motherName: 'Amelia Juliane Weintre',
    birthDate: '22 January 1872',
    birthYear: 1872,
    birthPlace: 'Tondano, Celebes (N.O.I.)',
    deathDate: '17 January 1946',
    deathYear: 1946,
    deathPlace: 'Bandoeng, West Java',
    occupation: 'Architect & Adjunct Commies, Staatsspoorwegen (Surabaya & Bandung)',
    heritageTags: ['Indo-European', 'Staatsspoorwegen', 'WWII War Victim'],
    region: 'Tondano, Surabaya & Bandung',
    bio: 'Son of Joseph Lang and Amelia Juliane Weintre. Worked for the Dutch East Indies State Railways (Staatsspoorwegen) in Surabaya (1920–1921) and Bandung (1938). Recorded in the Dutch War Graves Foundation (Oorlogsgravenstichting) casualty register after passing away in Bandung in January 1946.',
    spouses: [
      {
        id: 'sp-IIIh2-1',
        name: 'N. Bigot',
        surname: 'Bigot',
        marriageOrder: 1,
        marriageDate: 'before 1921'
      }
    ],
    sources: [
      'Almanak van Nederlandsch-Indië 1873, p. 255',
      'Regeringsalmanak 1938 Adressenlijst',
      'Oorlogsgravenstichting Slachtofferregister'
    ],
    sourceUrl: 'https://www.brouwertree.com/langgene.html#2b'
  },
  {
    id: 'III-i',
    code: 'III-i',
    firstName: 'Maurits Joachim',
    lastName: 'Lang',
    fullName: 'Maurits Joachim Lang',
    gender: 'male',
    generation: 3,
    branch: 'joseph',
    parentId: 'II-b',
    fatherName: 'Joseph Lang',
    motherName: 'Amelia Juliane Weintre',
    birthDate: '22 March 1874',
    birthYear: 1874,
    birthPlace: 'Tondano, Celebes (N.O.I.)',
    deathDate: '28 April 1955',
    deathYear: 1955,
    deathPlace: "'s-Gravenhage (The Hague), Netherlands",
    occupation: 'Architect & Project Developer, Staatsspoorwegen (Probolinggo & Malang)',
    religion: 'Nederlands Hervormd',
    heritageTags: ['Indo-European', 'Staatsspoorwegen', 'Malang', 'The Hague Diaspora'],
    region: 'Tondano, Malang & The Hague',
    photoUrl: '/images/portraits/maurits-lang.jpg',
    bio: 'Tall (over 1.85m), distinguished State Railways architect and property developer. Raised in Celebes, moved to East Java around 1900, and lived in a large Malang home beside the Malang–Surabaya rail line until WWII internment in 1941. Repatriated to The Hague with his wife Caroline in 1952 after celebrating their 50th wedding anniversary.',
    spouses: [
      {
        id: 'sp-IIIi-1',
        name: 'Caroline Jeanette Willemsen',
        surname: 'Willemsen',
        marriageOrder: 1,
        marriageDate: '9 July 1902',
        marriagePlace: 'Berbek (Ngandjoek), East Java',
        birthDate: '7 May 1885',
        birthPlace: 'Probolinggo, East Java',
        deathDate: '26 June 1967',
        deathPlace: "'s-Gravenhage, Netherlands",
        heritage: 'Dutch-French Indisch (Willemsen–Lemonnier)'
      }
    ],
    sources: [
      'Almanak van Nederlandsch-Indië 1901, p. 357 (Onderopzichter 3e kl. St. Sp. Probolingo)',
      'Regeringsalmanak 1938 Adressenlijst (Gep. Bouwk. S.S. Malang)',
      'Family 25th (1927) & 50th (1952) Wedding Anniversary Archives'
    ],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3i',
    isFeatured: true
  },
  {
    id: 'III-j',
    code: 'III-j',
    firstName: 'Bernard Thomas',
    lastName: 'Lang',
    fullName: 'Bernard Thomas Lang',
    gender: 'male',
    generation: 3,
    branch: 'joseph',
    parentId: 'II-b',
    fatherName: 'Joseph Lang',
    motherName: 'Amelia Juliane Weintre',
    birthDate: '5 July 1881',
    birthYear: 1881,
    birthPlace: 'Menado, Celebes (N.O.I.)',
    deathDate: '27 January 1927',
    deathYear: 1927,
    deathPlace: 'Bandoeng, West Java',
    burialPlace: 'Oude Begraafplaats Bandoeng, Class 1, nr. 930',
    occupation: 'Architect, Staatsspoorwegen (Batavia & Bandung)',
    heritageTags: ['Indo-European', 'Staatsspoorwegen', 'Batavia-Amsterdam Voyages'],
    region: 'Menado, Batavia & Bandung',
    bio: 'Son of Joseph Lang and Amelia Juliane Weintre. Served as architect for the State Railways in Batavia. Traveled to Amsterdam with his wife and four children aboard the SS Koningin der Nederlanden (1923) and returned via Rotterdam aboard the SS Insulinde (1925).',
    spouses: [
      {
        id: 'sp-IIIj-1',
        name: 'Louise (Wies) Henriette Meijer',
        surname: 'Meijer',
        marriageOrder: 1,
        marriageDate: '11 October 1905',
        marriagePlace: 'Soerabaja, East Java',
        birthDate: '17 December 1881',
        birthPlace: 'Probolinggo, East Java',
        deathDate: '8 September 1963',
        deathPlace: "'s-Gravenhage, Netherlands",
        heritage: 'Dutch-Indisch'
      }
    ],
    sources: [
      "Erica's Passenger Lists: SS Koningin der Nederlanden (1923) & SS Insulinde (1925)",
      'Bandoeng Oude Begraafplaats, Class 1, nr. 930'
    ],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3j'
  },
  {
    id: 'III-k',
    code: 'III-k',
    firstName: 'Catharina Wilhelmina',
    lastName: 'Lang',
    fullName: 'Catharina Wilhelmina (Mien) Lang',
    nickname: 'Mien',
    gender: 'female',
    generation: 3,
    branch: 'joseph',
    parentId: 'II-b',
    fatherName: 'Joseph Lang',
    motherName: 'Amelia Juliane Weintre',
    birthDate: '4 March 1889',
    birthYear: 1889,
    birthPlace: 'Remboken, North Celebes',
    heritageTags: ['Indo-Minahasan', 'Remboken', 'Pex Lineage', 'USA Diaspora'],
    region: 'Remboken & Surabaya',
    bio: 'Daughter of Joseph Lang and Amelia Juliane Weintre. Married Johannes Gerardus Pex of Surabaya; their grandson Peter Pex was raised by her brother Philip Benjamin Lang and later settled in Reading, Pennsylvania, USA.',
    spouses: [
      {
        id: 'sp-IIIk-1',
        name: 'Johannes Gerardus Pex',
        surname: 'Pex',
        marriageOrder: 1,
        birthDate: '24 January 1883',
        birthPlace: 'Soerabaja, Java',
        heritage: 'Dutch-Indisch (Pex–de Lugt)'
      }
    ],
    sources: ['BrouwerTree Lang Parenteel III-k', 'Correspondence Peter Pex (Pennsylvania, USA, 2005)'],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3k'
  },
  {
    id: 'III-k2',
    code: 'II-b.12',
    firstName: 'Philip Benjamin',
    lastName: 'Lang',
    fullName: 'Philip Benjamin (Flip) Lang',
    nickname: 'Flip',
    gender: 'male',
    generation: 3,
    branch: 'joseph',
    parentId: 'II-b',
    fatherName: 'Joseph Lang',
    motherName: 'Amelia Juliane Weintre',
    birthDate: '2 August 1890',
    birthYear: 1890,
    birthPlace: 'Tondano, Celebes (N.O.I.)',
    deathDate: 'ca. 1940',
    deathYear: 1940,
    deathPlace: 'Pasteur Hospital, Bandoeng',
    occupation: 'Sugar Chemist (Sf. Kanigoro, Madiun) & Field Employee (Sf. Bandjaratma, Tegal)',
    heritageTags: ['Indo-European', 'Java Sugar Industry', 'Tondano'],
    region: 'Tondano, Madiun & Tegal',
    bio: 'Youngest son of Joseph Lang and Amelia Juliane Weintre. Worked as a chemist at Kanigoro Sugar Factory (Madiun, 1916) and Bandjaratma Sugar Factory (Tegal, 1938). Married 1st-class nurse Emma Eekhout (daughter of Jan Bart Eekhout and Raden Perkis); they lovingly raised his sister Mien’s grandson Peter Pex.',
    spouses: [
      {
        id: 'sp-IIIk2-1',
        name: 'Emma (Emmy) Eekhout',
        surname: 'Eekhout',
        marriageOrder: 1,
        birthDate: '20 September 1904',
        birthPlace: 'Djokjakarta, Java',
        deathDate: '13 May 1950',
        deathPlace: "'s-Gravenhage, Netherlands",
        occupation: '1st Class Nurse (Verpleegster 1e klasse)',
        heritage: 'Dutch-Javanese Noble (daughter of Jan Bart Eekhout & Raden Perkis)'
      }
    ],
    sources: ['Almanak van Nederlandsch-Indië 1891, p. 356', 'Regeringsalmanak 1938'],
    sourceUrl: 'https://www.brouwertree.com/langgene.html#2b'
  },

  // ==================== GENERATION III (Branch II-c: Carolina Lang & Parera) ====================
  {
    id: 'III-l',
    code: 'III-l',
    firstName: 'Maria Adriana',
    lastName: 'Parera',
    fullName: 'Maria (Marietje) Adriana Parera',
    nickname: 'Marietje',
    gender: 'female',
    generation: 3,
    branch: 'carolina',
    parentId: 'II-c',
    fatherName: 'Johannis Marcus Parera',
    motherName: 'Carolina Lang',
    birthDate: '24 February 1867',
    birthYear: 1867,
    birthPlace: 'Menado / Tombariri, Minahasa',
    deathDate: '3 February 1941',
    deathYear: 1941,
    deathPlace: 'North Sulawesi',
    heritageTags: ['Minahasan', 'Parera-Mamahit Alliance', 'Mandar Royal Link'],
    region: 'Menado & Minahasa',
    bio: 'Eldest daughter of Majoor Johannis Marcus Parera and Carolina Lang. Married Helebrand Ferdinand Mamahit; together they had ten children who married into prominent Minahasan and Sulawesi families including Poluan, Paulus, Supit, Tumbuan, Suwawa, Assa, and the royal house of Mandar / Majene.',
    spouses: [
      {
        id: 'sp-IIIl-1',
        name: 'Helebrand Ferdinand Mamahit',
        surname: 'Mamahit',
        marriageOrder: 1,
        birthDate: '1862',
        deathDate: '13 April 1914',
        heritage: 'Minahasan (Mamahit clan)'
      }
    ],
    sources: ['BrouwerTree Lang Parenteel III-l'],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3l'
  },
  {
    id: 'III-m',
    code: 'III-m',
    firstName: 'Amelia Theodora',
    lastName: 'Parera',
    fullName: 'Amelia Theodora (Doortje) Parera',
    nickname: 'Doortje',
    gender: 'female',
    generation: 3,
    branch: 'carolina',
    parentId: 'II-c',
    fatherName: 'Johannis Marcus Parera',
    motherName: 'Carolina Lang',
    birthDate: 'ca. 1868',
    birthYear: 1868,
    birthPlace: 'Menado / Tombariri, Minahasa',
    heritageTags: ['Minahasan', 'Waworuntu Dynasty', 'Amoerang'],
    region: 'Menado & Amoerang, Minahasa',
    bio: 'Daughter of Johannis Marcus Parera and Carolina Lang. Married Albert Lasoet Waworoentoe (Waworuntu) in Menado in 1885, uniting the Lang–Parera lineage with one of Minahasa’s most influential families.',
    spouses: [
      {
        id: 'sp-IIIm-1',
        name: 'Albert Lasoet Waworoentoe',
        surname: 'Waworuntu',
        marriageOrder: 1,
        marriageDate: '26 September 1885',
        marriagePlace: 'Menado',
        birthDate: 'ca. 1865',
        heritage: 'Minahasan (Waworuntu clan)'
      }
    ],
    sources: ['Almanak van Nederlandsch-Indië 1887, p. 241 (Marriage Menado 26 Sept 1885)'],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3m'
  },
  {
    id: 'III-m2',
    code: 'II-c.3',
    firstName: 'Anna Louisa',
    lastName: 'Parera',
    fullName: 'Anna Louisa Parera',
    gender: 'female',
    generation: 3,
    branch: 'carolina',
    parentId: 'II-c',
    fatherName: 'Johannis Marcus Parera',
    motherName: 'Carolina Lang',
    birthDate: 'ca. 1871',
    birthYear: 1871,
    birthPlace: 'Menado, North Celebes',
    heritageTags: ['Minahasan', 'Warokka Clan'],
    region: 'Menado, North Sulawesi',
    bio: 'Daughter of Johannis Marcus Parera and Carolina Lang; married Lambertus Alanus Warokka in Menado on 16 April 1894.',
    spouses: [
      {
        id: 'sp-IIIm2-1',
        name: 'Lambertus Alanus Warokka',
        surname: 'Warokka',
        marriageOrder: 1,
        marriageDate: '16 April 1894',
        marriagePlace: 'Menado',
        heritage: 'Minahasan (Warokka clan)'
      }
    ],
    sources: ['Almanak van Nederlandsch-Indië 1895, p. 305'],
    sourceUrl: 'https://www.brouwertree.com/langgene.html#2c'
  },

  // ==================== GENERATION III (Branch II-d: Elisabeth Lang & Kuitert) ====================
  {
    id: 'III-o',
    code: 'III-o',
    firstName: 'Jan Jozef',
    lastName: 'Kuitert',
    fullName: 'Jan Jozef Kuitert',
    gender: 'male',
    generation: 3,
    branch: 'elisabeth',
    parentId: 'II-d',
    fatherName: 'Jan Wolters Kuitert',
    motherName: 'Elisabeth Lang',
    birthDate: '6 March 1865',
    birthYear: 1865,
    birthPlace: 'Menado, Celebes (N.O.I.)',
    deathDate: '11 October 1950',
    deathYear: 1950,
    deathPlace: 'Mokupa, Minahasa',
    occupation: 'Railway Sub-Clerk 3rd Cl. (1884) & Waterstaat Overseer (Menado/Amoerang)',
    heritageTags: ['Dutch-Minahasan', 'Groningen Roots', 'Mokupa Estate', 'Ransun Clan'],
    region: 'Menado, Amoerang & Mokupa',
    bio: 'Eldest son of Jan Wolters Kuitert and Elisabeth Lang. Worked in the State Railways Western Lines transport division and as Public Works (Waterstaat) overseer in Menado and Amoerang. Married Hermina Ransun of Koha and lived to age 85 at Mokupa.',
    spouses: [
      {
        id: 'sp-IIIo-1',
        name: 'Hermina (Mina) Ransun',
        surname: 'Ransun',
        marriageOrder: 1,
        marriageDate: '7 June 1902',
        marriagePlace: 'Amoerang, Celebes',
        birthDate: '7 April 1868',
        birthPlace: 'Koha, Celebes',
        deathDate: '2 August 1950',
        deathPlace: 'Mokupa',
        heritage: 'Minahasan (Ransun clan)'
      }
    ],
    sources: [
      'Almanak van Nederlandsch-Indië 1885, p. 403 & 414 (Spoorwegen)',
      'Almanak van Nederlandsch-Indië 1903, p. 25 (Marriage Amoerang)'
    ],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3o'
  },
  {
    id: 'III-p',
    code: 'III-p',
    firstName: 'Hendrik Jacob',
    lastName: 'Kuitert',
    fullName: 'Hendrik Jacob Kuitert',
    gender: 'male',
    generation: 3,
    branch: 'elisabeth',
    parentId: 'II-d',
    fatherName: 'Jan Wolters Kuitert',
    motherName: 'Elisabeth Lang',
    birthDate: '10 April 1868',
    birthYear: 1868,
    birthPlace: 'Gorontalo, North Celebes',
    deathDate: '28 June 1932',
    deathYear: 1932,
    deathPlace: "'s-Gravenhage (The Hague), Netherlands",
    burialPlace: 'Nieuw Eik en Duinen, The Hague',
    occupation: 'Architect (Bouwkundige), Staatsspoorwegen op Java (1911)',
    religion: 'Nederlands Hervormd',
    heritageTags: ['Dutch-Minahasan', 'Gorontalo', 'Staatsspoorwegen', 'The Hague'],
    region: 'Gorontalo, Madiun, Purwakarta & The Hague',
    bio: 'Son of Jan Wolters Kuitert and Elisabeth Lang. Rose from 2nd-class sub-overseer (1894) to Architect of the Java State Railways (1911), stationed in Surabaya, Berbek, Madiun, and Purwakarta. Sailed repeatedly between Batavia and Holland aboard the SS Koningin Emma (1915) and SS Slamat (1924).',
    spouses: [
      {
        id: 'sp-IIIp-1',
        name: 'Pietronella Christina Holtz',
        surname: 'Holtz',
        marriageOrder: 1,
        marriageDate: '28 June 1899',
        marriagePlace: 'Berbek, East Java',
        birthDate: '14 December 1882',
        birthPlace: 'Berbek, East Java',
        deathDate: 'after 1932',
        heritage: 'German-Indisch (daughter of Johan Adam Holtz & Maria Wilhelmina Kasima)'
      }
    ],
    sources: [
      'Almanak van Nederlandsch-Indië 1869, p. 73 (Birth Gorontalo)',
      'NRC 13 Nov 1911 (Appointed Bouwkundige Staatsspoorwegen)',
      'Het Vaderland 30 June 1932 (Obituary)'
    ],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3p'
  },
  {
    id: 'III-p2',
    code: 'II-d.3',
    firstName: 'Maria Elizabet',
    lastName: 'Kuitert',
    fullName: 'Maria Elizabet Kuitert',
    gender: 'female',
    generation: 3,
    branch: 'elisabeth',
    parentId: 'II-d',
    fatherName: 'Jan Wolters Kuitert',
    motherName: 'Elisabeth Lang',
    birthDate: '27 December 1869',
    birthYear: 1869,
    birthPlace: 'Gorontalo, North Celebes',
    occupation: 'Public School Teacher (Hulponderwijzeres) in Ambon (1890) & Surabaya (1897)',
    heritageTags: ['Dutch-Minahasan', 'Educator', 'Ambon & Surabaya'],
    region: 'Gorontalo, Ambon & Surabaya',
    bio: 'Daughter of Jan Wolters Kuitert and Elisabeth Lang. Pioneering woman educator appointed as assistant teacher in public elementary education in Amboina (1890) and Surabaya (1897–1900). Married Johannes Duivenbode.',
    spouses: [
      {
        id: 'sp-IIIp2-1',
        name: 'Johannes Duivenbode',
        surname: 'Duivenbode',
        marriageOrder: 1,
        birthDate: 'ca. 1885',
        heritage: 'Ternate-Menado (van Renesse van Duivenbode lineage)'
      }
    ],
    sources: ['Almanak van Nederlandsch-Indië 1871, p. 246a & 1891–1900 Onderwijs Ranglijst'],
    sourceUrl: 'https://www.brouwertree.com/langgene.html#2d'
  },
  {
    id: 'III-q',
    code: 'III-q',
    firstName: 'Berend Cornelis',
    lastName: 'Kuitert',
    fullName: 'Berend Cornelis Kuitert',
    gender: 'male',
    generation: 3,
    branch: 'elisabeth',
    parentId: 'II-d',
    fatherName: 'Jan Wolters Kuitert',
    motherName: 'Elisabeth Lang',
    birthDate: '26 June 1872',
    birthYear: 1872,
    birthPlace: 'Menado, North Celebes',
    occupation: '3rd Class Overseer, Burgerlijke Openbare Werken (B.O.W.), Menado & Gorontalo',
    heritageTags: ['Dutch-Minahasan', 'B.O.W. Engineer', 'Kalenkongan Clan'],
    region: 'Menado & Gorontalo',
    bio: 'Son of Jan Wolters Kuitert and Elisabeth Lang. Appointed 3rd Class Public Works Overseer (B.O.W.) in Menado and Gorontalo (1898–1900). Married Charlotta Antonetta Kalenkongan in Menado.',
    spouses: [
      {
        id: 'sp-IIIq-1',
        name: 'Charlotta Antonetta Kalenkongan',
        surname: 'Kalenkongan',
        marriageOrder: 1,
        marriageDate: '6 August 1892',
        marriagePlace: 'Menado',
        heritage: 'Minahasan (Kalenkongan clan)'
      }
    ],
    sources: [
      'Almanak van Nederlandsch-Indië 1873, p. 254 (Birth Menado)',
      'Almanak van Nederlandsch-Indië 1893, p. 302 (Marriage)',
      'Almanak van Nederlandsch-Indië 1900, p. 414 (B.O.W. Ranglijst)'
    ],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3q'
  },
  {
    id: 'III-q2',
    code: 'II-d.5',
    firstName: 'Diederikus',
    lastName: 'Kuitert',
    fullName: 'Diederikus Kuitert',
    gender: 'male',
    generation: 3,
    branch: 'elisabeth',
    parentId: 'II-d',
    fatherName: 'Jan Wolters Kuitert',
    motherName: 'Elisabeth Lang',
    birthDate: '24 January 1874 (recognition)',
    birthYear: 1874,
    birthPlace: 'Bondowoso, East Java',
    occupation: '2nd Marine Engineer, Gouvernements Marine aboard S.S. Hazewind (1898)',
    heritageTags: ['Dutch-Minahasan', 'Gouvernements Marine', 'East Java'],
    region: 'Bondowoso & Maritime N.O.I.',
    bio: 'Son of Jan Wolters Kuitert and Elisabeth Lang, born during his father’s posting in Bondowoso, East Java. Served as marine engineer in the Government Navy (Gouvernements Marine), advancing to 2nd Machinist aboard the steamship S.S. Hazewind.',
    spouses: [],
    sources: [
      'Almanak van Nederlandsch-Indië 1893–1900 (Gouvernements Marine Ranglijst)',
      'Alphabetische Lijst der Inwoners van Ned.-Indië 1899 (S.S. Hazewind)'
    ],
    sourceUrl: 'https://www.brouwertree.com/langgene.html#2d'
  },

  // ==================== GENERATION IV (Notable Highlights from langgene3.html) ====================
  {
    id: 'IV-b1',
    code: 'IV-b1',
    firstName: 'Frans Albert Dirk',
    lastName: 'Lang',
    fullName: 'Frans Albert Dirk Lang',
    gender: 'male',
    generation: 4,
    branch: 'hendrik',
    parentId: 'III-b',
    fatherName: 'Willem Albertus Lang',
    motherName: 'Josephina Elisabeth Davis',
    birthDate: '25 June 1887',
    birthYear: 1887,
    birthPlace: 'Kema, North Celebes',
    deathDate: '9 July 1944',
    deathYear: 1944,
    deathPlace: 'Mentok Internment Camp, Bangka',
    burialPlace: 'Nederlands Ereveld Leuwigajah, Cimahi (Vak VI, nr. 817)',
    occupation: 'Assistant Administrator, Billiton Tin Mining Co. (Biliton Mij.)',
    heritageTags: ['Indo-Minahasan', 'Billiton Mining', 'WWII War Hero'],
    region: 'Kema, Batavia & Bangka',
    bio: 'Eldest son of Willem Albertus Lang and Josephina Elisabeth Davis. Served as Assistant Administrator for the Billiton Mining Company in Batavia. Tragically perished at age 57 in the Mentok civilian internment camp on Bangka during WWII and is honored at the Dutch Field of Honor Leuwigajah.',
    spouses: [],
    sources: [
      'Almanak van Nederlandsch-Indië 1889, p. 347',
      'Oorlogsgravenstichting Slachtofferregister (Leuwigajah Vak VI nr. 817)'
    ],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3b'
  },
  {
    id: 'IV-c',
    code: 'IV-c',
    firstName: 'Louis Alexander Albertus',
    lastName: 'Lang',
    fullName: 'Louis (Louke) Alexander Albertus Lang',
    nickname: 'Louke',
    gender: 'male',
    generation: 4,
    branch: 'hendrik',
    parentId: 'III-b',
    fatherName: 'Willem Albertus Lang',
    motherName: 'Josephina Elisabeth Davis',
    birthDate: '21 September 1891',
    birthYear: 1891,
    birthPlace: 'Menado, North Celebes',
    deathDate: '4 May 1967',
    deathYear: 1967,
    deathPlace: "'s-Gravenhage, Netherlands",
    occupation: '1st Class Technical Official PTT Bandung · Knight of the Order of Orange-Nassau (1948)',
    heritageTags: ['Indo-Minahasan', 'Order of Orange-Nassau', 'Bandung & The Hague'],
    region: 'Menado, Bandung & The Hague',
    bio: 'Son of Willem Albertus Lang and Josephina Elisabeth Davis. Distinguished telecommunications official (PTT) in Bandung who was knighted as Ridder in de Orde van Oranje-Nassau on 23 August 1948 before retiring to The Hague.',
    spouses: [
      {
        id: 'sp-IVc-1',
        name: 'Angeline (Nieke) Croes',
        surname: 'Croes',
        marriageOrder: 1,
        marriageDate: '21 November 1917',
        marriagePlace: 'Bandoeng',
        birthDate: '25 June 1899',
        deathDate: '23 May 1934'
      },
      {
        id: 'sp-IVc-2',
        name: 'Josephine Juliana (Fietje) van Menxel',
        surname: 'van Menxel',
        marriageOrder: 2,
        marriageDate: '4 August 1936',
        marriagePlace: 'Bandoeng',
        birthDate: '19 October 1910',
        deathDate: '15 April 2000',
        deathPlace: "'s-Gravenhage"
      }
    ],
    sources: ['Regeringsalmanak 1919 nr. 3 & 1938 Adressenlijst', 'Royal Decree Order of Orange-Nassau (23 Aug 1948)'],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3b'
  },
  {
    id: 'IV-d',
    code: 'IV-d',
    firstName: 'Frederika Josephina Wilhelmina',
    lastName: 'Lang',
    fullName: 'Frederika Josephina Wilhelmina (Mien) Lang',
    nickname: 'Mien',
    gender: 'female',
    generation: 4,
    branch: 'hendrik',
    parentId: 'III-b',
    fatherName: 'Willem Albertus Lang',
    motherName: 'Josephina Elisabeth Davis',
    birthDate: '4 September 1904',
    birthYear: 1904,
    birthPlace: 'Menado, North Celebes',
    deathDate: '3 July 2004',
    deathYear: 2004,
    deathPlace: "'s-Gravenhage, Netherlands",
    heritageTags: ['Indo-Minahasan', 'Centenarian Generation', 'The Hague Diaspora'],
    region: 'Menado & The Hague',
    bio: 'Youngest daughter of Willem Albertus Lang and Josephina Elisabeth Davis. Married architect Jan Pereira by proxy ("met de handschoen") in 1930; lived nearly a full century (99 years and 10 months) spanning colonial Menado to 21st-century The Hague.',
    spouses: [
      {
        id: 'sp-IVd-1',
        name: 'Jan Pereira',
        surname: 'Pereira',
        marriageOrder: 1,
        marriageDate: '15 January 1930',
        birthDate: '30 November 1903',
        birthPlace: 'Probolinggo',
        deathDate: '6 August 1980',
        deathPlace: "'s-Gravenhage",
        occupation: 'Architect'
      }
    ],
    sources: ['BrouwerTree Lang Parenteel IV-d'],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3b'
  },
  {
    id: 'IV-l',
    code: 'IV-l',
    firstName: 'Carel',
    lastName: 'Lang',
    fullName: 'Carel Lang',
    gender: 'male',
    generation: 4,
    branch: 'hendrik',
    parentId: 'III-e',
    fatherName: 'Bernardus Jacob Lang',
    motherName: 'Barina Palendeng',
    birthDate: '7 October 1905',
    birthYear: 1905,
    birthPlace: 'Menado, North Sulawesi',
    deathDate: '5 June 1971',
    deathYear: 1971,
    heritageTags: ['Minahasan-Indisch', 'Gimon Clan'],
    region: 'North Sulawesi, Indonesia',
    bio: 'Eldest son of Bernardus Jacob Lang and Barina Palendeng; married Tinepikan Evehardina (Dien) Gimon, continuing the Minahasan branch of Hendrik Lang.',
    spouses: [
      {
        id: 'sp-IVl-1',
        name: 'Tinepikan Evehardina (Dien) Gimon',
        surname: 'Gimon',
        marriageOrder: 1,
        birthDate: 'ca. 1910',
        heritage: 'Minahasan'
      }
    ],
    sources: ['BrouwerTree Lang Parenteel IV-l', 'Photo archive Sergey Lang (2013)'],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3e'
  },
  {
    id: 'IV-ab',
    code: 'IV-ab',
    firstName: 'Joseph Carel Christiaan',
    lastName: 'Lang',
    fullName: 'Joseph Carel Christiaan Lang',
    gender: 'male',
    generation: 4,
    branch: 'joseph',
    parentId: 'III-i',
    fatherName: 'Maurits Joachim Lang',
    motherName: 'Caroline Jeanette Willemsen',
    birthDate: '11 July 1903',
    birthYear: 1903,
    birthPlace: 'Klakah, East Java',
    deathDate: '10 June 1943',
    deathYear: 1943,
    deathPlace: 'Tasnan near Bondowoso, East Java',
    burialPlace: 'Nederlands Ereveld Ancol, Jakarta',
    occupation: 'Architect & Building Contractor (Malang)',
    heritageTags: ['Indo-European', 'Malang Architect', 'WWII War Victim'],
    region: 'Klakah & Malang, East Java',
    bio: 'Eldest son of Maurits Joachim Lang and Caroline Jeanette Willemsen. Architect and contractor in Malang; perished in 1943 during WWII and was later reburied with honors at the Dutch Field of Honor Ancol in Jakarta.',
    spouses: [
      {
        id: 'sp-IVab-1',
        name: 'Louise Eykelenboom',
        surname: 'Eykelenboom',
        marriageOrder: 1,
        marriageDate: '16 February 1929',
        marriagePlace: 'Malang',
        birthDate: '18 October 1909',
        deathDate: '31 December 1982',
        deathPlace: 'Heerenveen, Netherlands'
      }
    ],
    sources: ['Regeringsalmanak 1938 (Bouwkundige Malang)', 'Nederlands Ereveld Ancol Archive'],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3i'
  },
  {
    id: 'IV-ac',
    code: 'IV-ac',
    firstName: 'Marie Jansje',
    lastName: 'Lang',
    fullName: 'Marie Jansje (Nita) Lang',
    nickname: 'Nita',
    gender: 'female',
    generation: 4,
    branch: 'joseph',
    parentId: 'III-i',
    fatherName: 'Maurits Joachim Lang',
    motherName: 'Caroline Jeanette Willemsen',
    birthDate: '10 August 1908',
    birthYear: 1908,
    birthPlace: 'Madiun, East Java',
    deathDate: '8 September 2000',
    deathYear: 2000,
    deathPlace: 'Calgary, Alberta, Canada',
    heritageTags: ['Indo-European', 'Canadian Diaspora', 'Madiun to Calgary'],
    region: 'Madiun, Kediri & Calgary, Canada',
    bio: 'Daughter of Maurits Joachim Lang and Caroline Jeanette Willemsen. Represented the North American diaspora of the Lang–Tampemawa lineage, living to age 92 in Calgary, Alberta, Canada.',
    spouses: [
      {
        id: 'sp-IVac-1',
        name: 'Gerard (Ger) Adolph Frans Duyshart',
        surname: 'Duyshart',
        marriageOrder: 1,
        birthDate: '20 March 1904',
        deathDate: '25 March 1999',
        deathPlace: 'Amsterdam',
        occupation: 'Provincial Waterstaat Overseer & Mechanical Engineer'
      },
      {
        id: 'sp-IVac-2',
        name: 'Louis Augenstein',
        surname: 'Augenstein',
        marriageOrder: 2,
        marriageDate: '12 April 1939',
        marriagePlace: 'Kediri',
        birthDate: '1 April 1910',
        deathDate: 'April 2001',
        occupation: 'Banker'
      }
    ],
    sources: ['BrouwerTree Lang Parenteel IV-ac'],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3i'
  },
  {
    id: 'IV-ad',
    code: 'IV-ad',
    firstName: 'Jan Pierre',
    lastName: 'Lang',
    fullName: 'Jan (Vent) Pierre Lang',
    nickname: 'Vent',
    gender: 'male',
    generation: 4,
    branch: 'joseph',
    parentId: 'III-i',
    fatherName: 'Maurits Joachim Lang',
    motherName: 'Caroline Jeanette Willemsen',
    birthDate: '5 October 1910',
    birthYear: 1910,
    birthPlace: 'Ponorogo, East Java',
    deathDate: '11 April 1999',
    deathYear: 1999,
    deathPlace: 'Royal Oak, Michigan, USA',
    occupation: 'Regency Controller (Nganjuk), Ministry Accountant (The Hague), Founder of Holland Bazaar (Michigan)',
    heritageTags: ['Indo-European', 'USA Diaspora', 'Michigan Entrepreneur'],
    region: 'Ponorogo, The Hague & Michigan, USA',
    bio: 'Son of Maurits Joachim Lang and Caroline Jeanette Willemsen. Served as Regency Controller in Nganjuk, emigrated to the Netherlands in 1949 and to the USA in 1959, where he founded Holland Bazaar—an iconic Dutch-Indonesian delicacy & souvenir shop in Clawson, Michigan (1972).',
    spouses: [
      {
        id: 'sp-IVad-1',
        name: 'Johanna (Joan) Ferdinanda van den Bos',
        surname: 'van den Bos',
        marriageOrder: 1,
        marriageDate: 'August 1934',
        birthDate: '23 January 1917',
        birthPlace: 'Situbondo, East Java',
        deathDate: '22 March 1986',
        deathPlace: 'Royal Oak, Michigan, USA'
      }
    ],
    sources: ['Regeringsalmanak 1938', 'BrouwerTree Lang Parenteel IV-ad'],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3i'
  },
  {
    id: 'IV-ag',
    code: 'IV-ag',
    firstName: 'James',
    lastName: 'Lang',
    fullName: 'James Lang',
    gender: 'male',
    generation: 4,
    branch: 'joseph',
    parentId: 'III-j',
    fatherName: 'Bernard Thomas Lang',
    motherName: 'Louise Henriette Meijer',
    birthDate: '14 August 1906',
    birthYear: 1906,
    birthPlace: 'Tulungagung, East Java',
    deathDate: '12 July 1978',
    deathYear: 1978,
    deathPlace: 'Málaga, Spain',
    occupation: 'Employee, Ned. Kon. Petroleum Mij. (Sungai Gerong, Palembang)',
    heritageTags: ['Indo-European', 'Sumatra Oil Industry', 'European Diaspora'],
    region: 'East Java, Palembang & Spain',
    bio: 'Eldest son of Bernard Thomas Lang and Louise Henriette Meijer. Worked for the Royal Dutch Petroleum Company in Sungai Gerong near Palembang, South Sumatra, before retiring to Europe.',
    spouses: [
      {
        id: 'sp-IVag-1',
        name: 'Eduarde Hortance Alberta van Dissel',
        surname: 'van Dissel',
        marriageOrder: 1,
        marriageDate: '16 June 1933',
        marriagePlace: 'Malang',
        birthDate: '17 June 1910',
        deathDate: '17 February 1993',
        deathPlace: 'Gouda, Netherlands'
      }
    ],
    sources: ['Regeringsalmanak 1938 (N.K.P. Mij Soengeigerong)'],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3j'
  },
  {
    id: 'IV-al',
    code: 'IV-al',
    firstName: 'Johannis Manuel',
    lastName: 'Mamahit',
    fullName: 'Johannis Manuel Mamahit',
    gender: 'male',
    generation: 4,
    branch: 'carolina',
    parentId: 'III-l',
    fatherName: 'Helebrand Ferdinand Mamahit',
    motherName: 'Maria Adriana Parera',
    birthDate: 'ca. 1889',
    birthYear: 1889,
    birthPlace: 'Menado, North Sulawesi',
    heritageTags: ['Minahasan', 'Mamahit-Poluan Clan'],
    region: 'Minahasa, North Sulawesi',
    bio: 'Eldest son of Helebrand Ferdinand Mamahit and Maria Adriana Parera, carrying forward Carolina Lang’s Minahasan line in North Sulawesi.',
    spouses: [
      {
        id: 'sp-IVal-1',
        name: 'Emma Poluan',
        surname: 'Poluan',
        marriageOrder: 1,
        birthDate: 'ca. 1895',
        heritage: 'Minahasan (Poluan clan)'
      }
    ],
    sources: ['BrouwerTree Lang Parenteel IV-al'],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3l'
  },
  {
    id: 'IV-ar',
    code: 'IV-ar',
    firstName: 'Berend Emaril',
    lastName: 'Mamahit',
    fullName: 'Berend (Bern) Emaril Mamahit',
    nickname: 'Bern',
    gender: 'male',
    generation: 4,
    branch: 'carolina',
    parentId: 'III-l',
    fatherName: 'Helebrand Ferdinand Mamahit',
    motherName: 'Maria Adriana Parera',
    birthDate: 'ca. 1904',
    birthYear: 1904,
    birthPlace: 'North Sulawesi',
    heritageTags: ['Minahasan', 'Mandar Royal Alliance', 'Makassar'],
    region: 'Makassar & West Sulawesi',
    bio: 'Son of Helebrand Ferdinand Mamahit and Maria Adriana Parera. Married Matahari Petta Lolo in Makassar, daughter of the Raja of Mandar / Majene in West Sulawesi.',
    spouses: [
      {
        id: 'sp-IVar-1',
        name: 'Matahari Petta Lolo',
        surname: 'Petta Lolo',
        marriageOrder: 1,
        marriagePlace: 'Makassar',
        birthDate: 'ca. 1910',
        heritage: 'Mandar / Majene Royalty (West Sulawesi)'
      }
    ],
    sources: ['BrouwerTree Lang Parenteel IV-ar'],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3l'
  },
  {
    id: 'IV-av',
    code: 'IV-av',
    firstName: 'Marie Elizabeth',
    lastName: 'Kuitert',
    fullName: 'Marie Elizabeth Kuitert',
    gender: 'female',
    generation: 4,
    branch: 'elisabeth',
    parentId: 'III-o',
    fatherName: 'Jan Jozef Kuitert',
    motherName: 'Hermina Ransun',
    birthDate: '5 October 1891',
    birthYear: 1891,
    birthPlace: 'Menado, North Celebes',
    deathDate: '1970',
    deathYear: 1970,
    heritageTags: ['Dutch-Minahasan', 'Duivenbode Lineage'],
    region: 'Menado, North Sulawesi',
    bio: 'Eldest daughter of Jan Jozef Kuitert and Hermina Ransun. Married Rudolph (Dolf) van Renesse van Duivenbode, uniting the Kuitert–Lang branch with the historic Ternate–Menado Duivenbode family.',
    spouses: [
      {
        id: 'sp-IVav-1',
        name: 'Rudolph (Dolf) van Renesse van Duivenbode',
        surname: 'van Renesse van Duivenbode',
        marriageOrder: 1,
        birthDate: 'ca. 1890',
        heritage: 'Dutch-Ternate-Menado Aristocratic Merchant Family'
      }
    ],
    sources: ['BrouwerTree Lang Parenteel IV-av'],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3o'
  },
  {
    id: 'IV-aw',
    code: 'IV-aw',
    firstName: 'Jacob Cornelis',
    lastName: 'Kuitert',
    fullName: 'Jacob Cornelis Kuitert',
    gender: 'male',
    generation: 4,
    branch: 'elisabeth',
    parentId: 'III-o',
    fatherName: 'Jan Jozef Kuitert',
    motherName: 'Hermina Ransun',
    birthDate: '4 April 1893',
    birthYear: 1893,
    birthPlace: 'Menado, North Celebes',
    deathDate: '1 June 1967',
    deathYear: 1967,
    deathPlace: 'Amsterdam, Netherlands',
    heritageTags: ['Dutch-Minahasan', 'Mononutu Clan', 'Amsterdam Diaspora'],
    region: 'Menado & Amsterdam',
    bio: 'Son of Jan Jozef Kuitert and Hermina Ransun. Married Sophia Maria Mononutu of Air Madidi (daughter of Arnold Mononutu and Charlotte Wilson) and later lived in Amsterdam.',
    spouses: [
      {
        id: 'sp-IVaw-1',
        name: 'Sophia Maria Mononutu',
        surname: 'Mononutu',
        marriageOrder: 1,
        birthDate: '19 July 1896',
        birthPlace: 'Air Madidi, Minahasa',
        deathDate: '19 August 1956',
        deathPlace: 'Amsterdam, Netherlands',
        heritage: 'Minahasan-British (Mononutu–Wilson)'
      }
    ],
    sources: ['BrouwerTree Lang Parenteel IV-aw'],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3o'
  },
  {
    id: 'IV-o-frits',
    code: 'III-o.7',
    firstName: 'Frits',
    lastName: 'Kuitert',
    fullName: 'Frits Kuitert',
    gender: 'male',
    generation: 4,
    branch: 'elisabeth',
    parentId: 'III-o',
    fatherName: 'Jan Jozef Kuitert',
    motherName: 'Hermina Ransun',
    birthDate: '31 October 1906',
    birthYear: 1906,
    birthPlace: 'Menado, North Celebes',
    deathDate: '9 June 1994',
    deathYear: 1994,
    occupation: '1st Mate Merchant Marine (1e Stuurman Grote Stoomvaart)',
    heritageTags: ['Dutch-Minahasan', 'Maritime Officer', 'Dual-Era Citizenship'],
    region: 'Menado, Batavia & Netherlands',
    bio: 'Son of Jan Jozef Kuitert and Hermina Ransun. Earned his 3rd, 2nd, and 1st Mate certificates for ocean-going steamships in Batavia (1925–1933). Opted for Indonesian citizenship in 1951 intending to return to his birthplace Menado, and was later restored to Dutch nationality by Royal Naturalization Act in 1961.',
    spouses: [
      {
        id: 'sp-IVfrits-1',
        name: 'Fietje Ompie',
        surname: 'Ompie',
        marriageOrder: 1,
        birthDate: 'ca. 1910'
      },
      {
        id: 'sp-IVfrits-2',
        name: 'A.M.B. (Babs) Deckers',
        surname: 'Deckers',
        marriageOrder: 2,
        birthDate: 'ca. 1910'
      }
    ],
    sources: [
      'Bataviaasch Nieuwsblad 23 June 1931 & Het Nieuws van den Dag 21 March 1933 (Stuurlieden-Examens)',
      'Dutch Parliament Naturalization Act 1961–1962 nr. 6633'
    ],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3o'
  },
  {
    id: 'IV-az',
    code: 'IV-az',
    firstName: 'Angelique Felicitas',
    lastName: 'Kuitert',
    fullName: 'Angelique Felicitas Kuitert',
    gender: 'female',
    generation: 4,
    branch: 'elisabeth',
    parentId: 'III-p',
    fatherName: 'Hendrik Jacob Kuitert',
    motherName: 'Pietronella Christina Holtz',
    birthDate: '28 February 1911',
    birthYear: 1911,
    birthPlace: 'Nganjuk, East Java',
    religion: 'Nederlands Hervormd',
    heritageTags: ['Dutch-Minahasan', 'East Java', 'Zeist Diaspora'],
    region: 'Nganjuk, Surabaya & Zeist',
    bio: 'Daughter of State Railway Architect Hendrik Jacob Kuitert and Pietronella Christina Holtz. Married planter and soil scientist Johannes Henricus Broese in Surabaya in 1947.',
    spouses: [
      {
        id: 'sp-IVaz-1',
        name: 'Johannes Henricus Broese',
        surname: 'Broese',
        marriageOrder: 1,
        marriageDate: '15 July 1947',
        marriagePlace: 'Soerabaja',
        birthDate: '26 August 1907',
        birthPlace: 'Malang',
        deathDate: '1973',
        deathPlace: 'Zeist, Netherlands',
        occupation: 'Planter & Soil Scientist (Bodemkundige)'
      }
    ],
    sources: ['BrouwerTree Lang Parenteel IV-az'],
    sourceUrl: 'https://www.brouwertree.com/langgene3.html#3p'
  }
];

export const ARCHIVAL_RECORDS: ArchivalSourceRecord[] = [
  {
    id: 'arc-voc-1723',
    category: 'VOC Voyage',
    year: 1723,
    dateLabel: '30 Nov 1723 – 29 Sep 1724',
    title: 'VOC Voyage of Jacob Lang (of Kolbergen) on Ship Heinkenszand',
    personNames: ['Jacob Lang (Kolbergen)'],
    location: 'Chamber of Zeeland → Batavia',
    summary: 'Sailor (matroos) Jacob Lang from Kolbergen departed Zeeland for Batavia aboard VOC ship Heinkenszand (10-month voyage); repatriated 1725. Documented as an early VOC precedent of the Lang name in the Indies.',
    sourceCitation: 'VOC Opvarenden 1700–1794 (Kamer Zeeland)',
    memberId: 'I',
    pageRef: 'langgene.html'
  },
  {
    id: 'arc-voc-1778',
    category: 'VOC Voyage',
    year: 1778,
    dateLabel: '19 Jul 1778 – 16 Dec 1779',
    title: 'VOC Voyage of Jacob Lang (of Roelingen) on Ship Europa',
    personNames: ['Jacob Lang (Roelingen)'],
    location: 'Chamber of Zeeland → Batavia → Asia',
    summary: 'Soldier (soldaat) Jacob Lang from Roelingen sailed aboard VOC ship Europa arriving in Batavia on 28 Feb 1779; passed away in Asia on 16 Dec 1779.',
    sourceCitation: 'VOC Opvarenden 1700–1794 (Kamer Zeeland)',
    memberId: 'I',
    pageRef: 'langgene.html'
  },
  {
    id: 'arc-ternate-1796',
    category: 'Directory',
    year: 1796,
    dateLabel: 'June 1796',
    title: 'Landmonsterrol van Ternate — Arnoldus Uitenbroek & Joseph Parera',
    personNames: ['Arnoldus Uitenbroek', 'Joseph Parera'],
    location: 'Ternate, Moluccas',
    summary: 'VOC muster roll documenting Chief Surgeon Arnoldus Uitenbroek (from Nijmegen, arrived 1788 on ship Zoutman) and Joseph Parera (from Ternate, Zeeland chamber, arrived 1790)—early archival records of the allied Uijtenbroeck and Parera families.',
    sourceCitation: 'Landmonsterrol van Ternate, June 1796',
    memberId: 'II-c',
    pageRef: 'langgene.html'
  },
  {
    id: 'arc-mar-1842',
    category: 'Civil Registry',
    year: 1842,
    dateLabel: '12 May 1842',
    title: 'Marriage of Jacob Lang and Maria Tampemawa',
    personNames: ['Jacob Lang', 'Maria Tampemawa'],
    location: 'Menado, North Celebes',
    summary: 'Official Civil Registry entry recording the marriage of Jacob Lang and Maria Tampawawa (Tampemawa) in Menado.',
    sourceCitation: 'Almanak van Nederlandsch-Indië, 1843, p. A 258',
    memberId: 'I',
    pageRef: 'langgene.html#1'
  },
  {
    id: 'arc-death-1845',
    category: 'Civil Registry',
    year: 1845,
    dateLabel: '1 December 1845',
    title: 'Death Declarations of Jacob Lang & Young Children',
    personNames: ['Jacob Lang', 'Jacob Philip Lang', 'Johanna Catharina Lang'],
    location: 'Menado, North Celebes',
    summary: 'Civil Registry death entries in Menado recording Jacob Lang (1 Dec 1845), followed by his youngest children Jacob Filip Lang (23 Feb 1846) and Johanna Catharina Lang (23 Mar 1846).',
    sourceCitation: 'Regerings-Almanak van Nederlandsch-Indië, 1847, p. A 387',
    memberId: 'I',
    pageRef: 'langgene.html#1'
  },
  {
    id: 'arc-dep-1857',
    category: 'Passenger List',
    year: 1857,
    dateLabel: '11 August 1857',
    title: 'Departure of Jan Wolters Kuitert from Groningen to Menado',
    personNames: ['Jan Wolters Kuitert', 'Frouke Kuitert', 'Cornelius Kuitert'],
    location: 'Groningen, Netherlands → Menado, Celebes',
    summary: 'Following the death of his first wife Hinderkien de Jonge in Groningen, master carpenter Jan Wolters Kuitert sailed to Menado with his two surviving children, later marrying Elisabeth Lang in 1863.',
    sourceCitation: 'GenLias Groningen & Kuitert Family Chronicle',
    memberId: 'II-d',
    pageRef: 'langgene.html#2d'
  },
  {
    id: 'arc-mar-1865',
    category: 'Civil Registry',
    year: 1865,
    dateLabel: 'March 1865',
    title: 'Double Sibling Marriages: Joseph Lang & Carolina Lang',
    personNames: ['Joseph Lang', 'Amelia Juliane Weintre', 'Carolina Lang', 'Johannis Marcus Parera'],
    location: 'Menado, North Celebes',
    summary: 'Within three weeks of each other in Menado, Joseph Lang married Amelie Julienne Weintré (6 March 1865) and his sister Carolina Lang married Majoor Johannis Marcus Parera (29 March 1865).',
    sourceCitation: 'Almanak van Nederlandsch-Indië, 1866, p. 22',
    memberId: 'II-b',
    pageRef: 'langgene.html#2b'
  },
  {
    id: 'arc-estate-1896',
    category: 'Directory',
    year: 1896,
    dateLabel: '1896',
    title: 'Particuliere Landerijen: Mukupa & Tateli Nutmeg Plantations',
    personNames: ['Jan Wolters Kuitert', 'Jan Alexander Lang'],
    location: 'Residentie Menado, North Celebes',
    summary: 'Official colonial land register listing two family-owned nutmeg estates in Menado: Mukupa (27 bouws, owner J.W. Kuitert, tax value 650) and Tateli (26 bouws, owner J.A. Lang, tax value 2400).',
    sourceCitation: 'Almanak van Nederlandsch-Indië 1896, p. 377',
    memberId: 'II-d',
    pageRef: 'langgene.html#2d'
  },
  {
    id: 'arc-grave-1912',
    category: 'Gravestone',
    year: 1912,
    dateLabel: '25 April 1912',
    title: 'Epitaph of Amelia Juliane Lang-Weintre at Blitar',
    personNames: ['Amelia Juliane Weintre'],
    location: 'Blitar Cemetery, East Java (Plot nr. 287)',
    summary: '"Hier rust onze geliefde moeder A.J. Lang-Weintre, geb. Menado 22 mei 1846, overleden te Blitar 25 april 1912."',
    sourceCitation: 'CD-ROM Indische Genealogische Vereniging',
    memberId: 'II-b',
    pageRef: 'langgene.html#2b'
  },
  {
    id: 'arc-ship-1923',
    category: 'Passenger List',
    year: 1923,
    dateLabel: '28 April 1923 & 25 July 1925',
    title: 'Batavia–Amsterdam Voyages of Bernard Thomas Lang Family',
    personNames: ['Bernard Thomas Lang', 'Louise Henriette Meijer'],
    location: 'Batavia ↔ Amsterdam / Rotterdam',
    summary: 'B.Th. Lang, his wife, and four children sailed aboard SS Koningin der Nederlanden from Batavia to Amsterdam (April 1923) and returned aboard SS Insulinde from Rotterdam (July 1925).',
    sourceCitation: "Erica's Passagierslijsten",
    memberId: 'III-j',
    pageRef: 'langgene3.html#3j'
  },
  {
    id: 'arc-almanak-1938',
    category: 'Directory',
    year: 1938,
    dateLabel: '1938',
    title: 'Regeringsalmanak 1938 — 19 Lang Family Professionals Across the Archipelago',
    personNames: ['Maurits Joachim Lang', 'Hendrik Auguste Lang', 'Frans Albert Dirk Lang', 'Louis A.A. Lang', 'Philip Benjamin Lang', 'Jan Pierre Lang', 'James Lang'],
    location: 'Menado, Malang, Bandung, Surabaya, Palembang, Tegal, Nganjuk',
    summary: 'Directory snapshot showing Lang descendants across every major sector of the Dutch East Indies: State Railways (S.S.), PTT, Billiton Tin, Royal Dutch Petroleum (N.K.P. Mij.), sugar estates, and regency governance.',
    sourceCitation: 'Regeringsalmanak voor Nederlandsch-Indië, 1938 Adressenlijst',
    memberId: 'III-i',
    pageRef: 'langgene.html#2b'
  },
  {
    id: 'arc-war-1944',
    category: 'War Grave',
    year: 1944,
    dateLabel: '9 July 1944',
    title: 'Oorlogsgravenstichting Record — Frans Albert Dirk Lang',
    personNames: ['Frans Albert Dirk Lang'],
    location: 'Mentok, Bangka → Ereveld Leuwigajah, Cimahi',
    summary: 'Victim of WWII civilian internment camp at Mentok, Bangka; interred at Netherlands Field of Honor Leuwigajah, Vak VI, nr. 817.',
    sourceCitation: 'Oorlogsgravenstichting Slachtofferregister',
    memberId: 'IV-b1',
    pageRef: 'langgene3.html#3b'
  },
  {
    id: 'arc-ship-1949',
    category: 'Passenger List',
    year: 1949,
    dateLabel: '1949',
    title: 'Motorschip Sibajak Passenger List (Rotterdam → Surabaya)',
    personNames: ['J.M. Goedbloed-Weintre'],
    location: 'Rotterdam → Port Said → Sabang → Batavia → Surabaya',
    summary: 'Post-war voyage of the iconic Dutch liner MS Sibajak connecting Rotterdam and Java, carrying members of the allied Weintre family.',
    sourceCitation: 'Transcript by Lex Slager (featured in BrouwerTree with MS Sibajak illustration)',
    memberId: 'II-b',
    pageRef: 'langgene.html#2b'
  },
  {
    id: 'arc-nat-1961',
    category: 'Naturalization',
    year: 1961,
    dateLabel: '1961–1962 (Bill nr. 6633)',
    title: 'Dutch Parliamentary Naturalization of Frits Kuitert',
    personNames: ['Frits Kuitert'],
    location: 'Menado → The Hague, Netherlands',
    summary: 'Act of Parliament restoring Dutch nationality to retired 1st Mate Frits Kuitert (born Menado 1905/1906), noting his 1951 option for Indonesian citizenship out of devotion to his native Menado.',
    sourceCitation: 'Tweede Kamer Zitting 1961–1962, nr. 6633 (Minister A.C.W. Beerman)',
    memberId: 'IV-o-frits',
    pageRef: 'langgene3.html#3o'
  }
];

export const HERITAGE_ORIGINS_SEED: HeritageOriginSeed[] = [
  {
    id: 'her-lang',
    surname: 'Lang',
    heritageGroup: 'Dutch / Germanic',
    ancestralRegion: 'Germanic / Netherlands (VOC Zeeland) → Menado, North Sulawesi',
    firstAppearanceGen: 'Generation I',
    firstAppearanceYear: 1805,
    notableMembers: 'Jacob Lang (I), Hendrik (II-a), Joseph (II-b), Maurits Joachim (III-i)',
    historicalContext: 'European surname attested in 18th-century VOC rosters (Kolbergen, Roelingen, Ambon 1768) that took deep root in Menado through Jacob Lang & Maria Tampemawa.',
    wikipediaSlug: 'Indo_people'
  },
  {
    id: 'her-tampemawa',
    surname: 'Tampemawa',
    heritageGroup: 'Minahasan (North Sulawesi)',
    ancestralRegion: 'Minahasa Highlands & Manado, North Sulawesi, Indonesia',
    firstAppearanceGen: 'Generation I',
    firstAppearanceYear: 1810,
    notableMembers: 'Maria Tampemawa (I)',
    historicalContext: 'Indigenous Minahasan family name (fam) from North Sulawesi. Maria Tampemawa’s 1842 marriage to Jacob Lang anchors the entire lineage’s Minahasan maternal heritage.',
    wikipediaSlug: 'Minahasan_people'
  },
  {
    id: 'her-kuitert',
    surname: 'Kuitert',
    heritageGroup: 'Dutch / Germanic',
    ancestralRegion: 'Groningen, Northern Netherlands → Menado & East Java',
    firstAppearanceGen: 'Generation II (II-d)',
    firstAppearanceYear: 1821,
    notableMembers: 'Jan Wolters Kuitert, Jan Jozef (III-o), Hendrik Jacob (III-p), Berend Cornelis (III-q)',
    historicalContext: 'Northern Dutch artisan family (silversmiths & carpenters in Groningen) transplanted to Menado in 1857, bridging Dutch engineering with Minahasan family ties.',
    wikipediaSlug: 'Groningen'
  },
  {
    id: 'her-parera',
    surname: 'Parera',
    heritageGroup: 'Moluccan-Portuguese',
    ancestralRegion: 'Portuguese-Moluccan (Ternate 1796) → Tombariri, Minahasa',
    firstAppearanceGen: 'Generation II (II-c)',
    firstAppearanceYear: 1823,
    notableMembers: 'Majoor Johannis Marcus Parera, Maria Adriana (III-l), Amelia Theodora (III-m)',
    historicalContext: 'Luso-Asian / Mestizo heritage name (variant of Pereira) documented in Ternate VOC rolls (1796) and elevated to Minahasan district leadership (Majoor of Tombariri).',
    wikipediaSlug: 'Tombariri'
  },
  {
    id: 'her-weintre',
    surname: 'Weintre',
    heritageGroup: 'English-Indisch',
    ancestralRegion: 'Ternate, Menado & Blitar (English & Franco-Dutch Indisch ties)',
    firstAppearanceGen: 'Generation II (II-b)',
    firstAppearanceYear: 1846,
    notableMembers: 'Amelia Juliane Weintre (m. Joseph Lang), L.A.B. Weintre (Militaire Willemsorde)',
    historicalContext: 'Distinguished Indisch family documented in Ternate from 1785, Menado, Batavia, and Surabaya; oral family history notes Amelia held English nationality.',
    wikipediaSlug: 'Manado'
  },
  {
    id: 'her-engelen',
    surname: 'Engelen',
    heritageGroup: 'Dutch / Germanic',
    ancestralRegion: 'Netherlands → Batavia, Semarang & Kema (North Sulawesi)',
    firstAppearanceGen: 'Generation II (II-a)',
    firstAppearanceYear: 1835,
    notableMembers: 'Gritjie Engelen (1st wife of Hendrik Lang)',
    historicalContext: 'Dutch colonial administrative and military surname prominently recorded across Semarang, Batavia, Padang, and Kema from 1817 onward.',
    wikipediaSlug: 'Kema,_North_Sulawesi'
  },
  {
    id: 'her-uijtenbroeck',
    surname: 'Uijtenbroeck',
    heritageGroup: 'Dutch / Germanic',
    ancestralRegion: 'Nijmegen (Gelderland, Netherlands) → Ternate (1788) & Menado',
    firstAppearanceGen: 'Generation II (II-a)',
    firstAppearanceYear: 1845,
    notableMembers: 'Maria Louise Uijtenbroeck (2nd wife of Hendrik Lang), Bernardus Jacob Lang (III-e)',
    historicalContext: 'Old Dutch surname connected to VOC Chief Surgeon Arnoldus Uitenbroek (Nijmegen, arrived Ternate 1788 aboard Zoutman).',
    wikipediaSlug: 'Dutch_East_India_Company'
  },
  {
    id: 'her-waworuntu',
    surname: 'Waworuntu',
    heritageGroup: 'Minahasan (North Sulawesi)',
    ancestralRegion: 'Minahasa (Manado, Tondano, Sonder & Amoerang), North Sulawesi',
    firstAppearanceGen: 'Generation III (III-m)',
    firstAppearanceYear: 1865,
    notableMembers: 'Albert Lasoet Waworoentoe (m. Amelia Parera), Wilhelmina Waworuntu',
    historicalContext: 'One of Minahasa’s most storied indigenous aristocratic clans (fam), active in colonial governance, regional leadership, and modern Indonesian history.',
    wikipediaSlug: 'Tondano'
  },
  {
    id: 'her-mamahit',
    surname: 'Mamahit',
    heritageGroup: 'Minahasan (North Sulawesi)',
    ancestralRegion: 'Minahasa, North Sulawesi → Makassar & Mandar',
    firstAppearanceGen: 'Generation III (III-l)',
    firstAppearanceYear: 1862,
    notableMembers: 'Helebrand Ferdinand Mamahit, Johannis Manuel (IV-al), Berend Emaril (IV-ar)',
    historicalContext: 'Prominent Minahasan clan united with the Lang–Parera line in Generation III, later intermarrying with Mandar/Majene nobility of West Sulawesi.',
    wikipediaSlug: 'North_Sulawesi'
  },
  {
    id: 'her-willemsen',
    surname: 'Willemsen',
    heritageGroup: 'Indo-European (N.O.I.)',
    ancestralRegion: 'Probolinggo & Malang, East Java → The Hague, Canada & USA',
    firstAppearanceGen: 'Generation III (III-i)',
    firstAppearanceYear: 1885,
    notableMembers: 'Caroline Jeanette Willemsen (m. Maurits Joachim Lang)',
    historicalContext: 'Dutch-French Indisch lineage of East Java (Willemsen–Lemonnier) whose union with Maurits Joachim Lang sparked the Malang, Hague, Calgary, and Michigan diaspora.',
    wikipediaSlug: 'Dutch_East_Indies'
  }
];
