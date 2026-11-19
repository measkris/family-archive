export type AppLocale = 'id' | 'en' | 'nl';

export const LOCALE_META: Record<AppLocale, { code: string; label: string; nativeName: string }> = {
  id: { code: 'ID', label: 'ID', nativeName: 'Bahasa Indonesia' },
  en: { code: 'EN', label: 'EN', nativeName: 'English' },
  nl: { code: 'NL', label: 'NL', nativeName: 'Nederlands' },
};

export interface UiDictionary {
  // Brand & Header
  brandSubtitle: string;
  brandSubtitleShort: string;
  treeGroupsLabel: string;
  treeGroupSingular: string;
  treeGroupPlural: string;
  collectionSingular: string;
  collectionPlural: string;
  recordsLabel: string;
  bulkImport: string;
  importExcelUrl: string;
  newFamilyTree: string;
  addFamilyTreeGroup: string;
  addMember: string;
  addShort: string;
  readOnlyPublic: string;
  signInRegister: string;
  signInShort: string;
  signOut: string;
  superAdmin: string;
  allViewable: string;
  myInvitedTrees: string;
  activeBadge: string;
  publicBadge: string;
  privateBadge: string;
  ownerBadge: string;
  collaboratorBadge: string;
  adminBadge: string;
  shareButton: string;
  personSingular: string;
  personPlural: string;
  generationSingular: string;
  generationPlural: string;
  emptyTreeReady: string;
  startYourOwnLineage: string;
  createYourOwnTree: string;
  signInEmailOrGoogle: string;
  keyAncestors: string;

  // Main Tabs
  tabTreeChart: string;
  tabHeritageApis: string;
  tabMembersTable: string;
  tabPhotoArchive: string;
  viewingLabel: string;
  clickAnyCardToInspect: string;
  noAncestorsYet: string;
  addFoundingAncestor: string;
  onlyOwnerCanAdd: string;

  // Footer
  footerTagline: string;
  allRightsReserved: string;

  // Interactive Family Tree
  all4Branches: string;
  gen1To2: string;
  gen1To3: string;
  gen1To4: string;
  findInTree: string;
  findPersonPlaceholder: string;
  fullProfile: string;
  detailsAndFamily: string;
  heritageAndSources: string;
  bornLabel: string;
  diedLabel: string;
  marriageLabel: string;
  occupationLabel: string;
  parentsLabel: string;
  spouseLabel: string;
  spousesLabel: string;
  childrenLabel: string;
  siblingsLabel: string;
  noBirthData: string;
  noDeathData: string;
  noOccupationData: string;
  noSpouseData: string;
  noChildrenData: string;
  foundingNoParents: string;
  heritageAndBio: string;
  archivalSourcesAndHints: string;
  openFullProfileHints: string;

  // Ancestry Profile View
  backToTree: string;
  viewInTree: string;
  searchArchives: string;
  addChild: string;
  editLabel: string;
  factsTab: string;
  hintsTab: string;
  galleryTab: string;
  lifeStoryTab: string;
  heritageTab: string;
  ancestralMapLocation: string;
  timelineTitle: string;
  familyMembersTitle: string;
  mediaPortraitsTitle: string;
  uploadPhoto: string;

  // Members Directory Table
  completeDirectory: string;
  exportCsv: string;
  searchDirectoryPlaceholder: string;
  allGenerations: string;
  allBranches: string;
  ancestorCol: string;
  codeGenCol: string;
  lifespanPlaceCol: string;
  occupationHeritageCol: string;
  actionsCol: string;
  viewProfile: string;
  locateInTree: string;

  // Heritage, Map & Resources
  subTabOrigins: string;
  subTabOpenArchives: string;
  subTabPlacesMap: string;
  subTabPrimarySources: string;
  interactiveMapTitle: string;
  interactiveMapSubtitle: string;
  mapFocusAll: string;
  mapToggleRoutes: string;
  mapShowOnMap: string;
  mapMembersLinked: string;
  familyResourcesTitle: string;
  familyResourcesSubtitle: string;
  openExternalResource: string;
  refreshLiveApis: string;

  // Auth Dialog
  authTitle: string;
  authDescription: string;
  continueWithGoogle: string;
  googleFullPageFallback: string;
  orWithEmail: string;
  signInTab: string;
  registerTab: string;
  fullNameLabel: string;
  emailLabel: string;
  passwordLabel: string;
  signInWithEmail: string;
  createFreeAccount: string;
}

export const UI_TRANSLATIONS: Record<AppLocale, UiDictionary> = {
  en: {
    brandSubtitle: 'Interactive Genealogy & Heritage',
    brandSubtitleShort: 'Genealogy & Heritage',
    treeGroupsLabel: 'Family Tree Groups',
    treeGroupSingular: 'Tree Group',
    treeGroupPlural: 'Tree Groups',
    collectionSingular: 'Collection',
    collectionPlural: 'Collections',
    recordsLabel: 'Records',
    bulkImport: 'Bulk Import',
    importExcelUrl: 'Import Excel / URL',
    newFamilyTree: 'New Family Tree',
    addFamilyTreeGroup: 'Add Family Tree Group',
    addMember: 'Add Member',
    addShort: 'Add',
    readOnlyPublic: 'Read-Only Public View',
    signInRegister: 'Sign In / Register',
    signInShort: 'Sign In',
    signOut: 'Sign Out',
    superAdmin: 'Super Admin',
    allViewable: 'All Viewable',
    myInvitedTrees: 'My & Invited Trees',
    activeBadge: 'Active',
    publicBadge: 'Public',
    privateBadge: 'Private',
    ownerBadge: 'Owner',
    collaboratorBadge: 'Collaborator',
    adminBadge: 'Admin',
    shareButton: 'Share',
    personSingular: 'person',
    personPlural: 'people',
    generationSingular: 'Generation',
    generationPlural: 'Generations',
    emptyTreeReady: 'Empty tree · Ready to build',
    startYourOwnLineage: 'Start your own family lineage',
    createYourOwnTree: 'Create Your Own Tree',
    signInEmailOrGoogle: 'Sign in with Email or Google',
    keyAncestors: 'Key Ancestors',

    tabTreeChart: 'Family Tree Chart',
    tabHeritageApis: 'Heritage, Map & Sources',
    tabMembersTable: 'Members Table',
    tabPhotoArchive: 'Photo Archive',
    viewingLabel: 'Viewing',
    clickAnyCardToInspect: 'Click any card to inspect',
    noAncestorsYet: 'This family tree group has no ancestors yet.',
    addFoundingAncestor: 'Add Founding Ancestor',
    onlyOwnerCanAdd: 'Only the tree owner or collaborators can add members.',

    footerTagline: 'Multi-Family Genealogy & Heritage Platform',
    allRightsReserved: 'All rights reserved.',

    all4Branches: 'All 4 Branches',
    gen1To2: 'Gen I – II',
    gen1To3: 'Gen I – III',
    gen1To4: 'All Gen I – IV',
    findInTree: 'Find in tree',
    findPersonPlaceholder: 'Find person or spouse...',
    fullProfile: 'Full Profile',
    detailsAndFamily: 'Details & Family',
    heritageAndSources: 'Heritage & Sources',
    bornLabel: 'Born',
    diedLabel: 'Died',
    marriageLabel: 'Marriage',
    occupationLabel: 'Occupation',
    parentsLabel: 'Parents',
    spouseLabel: 'Spouse',
    spousesLabel: 'Spouses',
    childrenLabel: 'Children',
    siblingsLabel: 'Siblings',
    noBirthData: 'No birth data recorded',
    noDeathData: 'No death data recorded',
    noOccupationData: 'No occupation data recorded',
    noSpouseData: 'No spouse recorded for this person.',
    noChildrenData: 'No children recorded in this tree yet.',
    foundingNoParents: 'Founding ancestor — no parents recorded in archive.',
    heritageAndBio: 'Heritage & Biography',
    archivalSourcesAndHints: 'Archival Sources & Hints',
    openFullProfileHints: 'Open Full Profile & Live OpenArchives Hints',

    backToTree: 'Back to Tree',
    viewInTree: 'View in Tree',
    searchArchives: 'Search Archives',
    addChild: 'Add Child',
    editLabel: 'Edit',
    factsTab: 'Facts',
    hintsTab: 'Hints',
    galleryTab: 'Gallery',
    lifeStoryTab: 'LifeStory',
    heritageTab: 'Heritage',
    ancestralMapLocation: 'Ancestral Location on Map',
    timelineTitle: 'Life Events & Timeline',
    familyMembersTitle: 'Family Members',
    mediaPortraitsTitle: 'Media & Portraits',
    uploadPhoto: 'Upload Photo',

    completeDirectory: 'Complete Family Directory',
    exportCsv: 'Export CSV',
    searchDirectoryPlaceholder: 'Search name, spouse, birthplace, occupation, or heritage...',
    allGenerations: 'All Generations',
    allBranches: 'All Branches',
    ancestorCol: 'Ancestor',
    codeGenCol: 'Code & Gen',
    lifespanPlaceCol: 'Lifespan & Place',
    occupationHeritageCol: 'Occupation & Heritage',
    actionsCol: 'Actions',
    viewProfile: 'Profile',
    locateInTree: 'Tree',

    subTabOrigins: 'Surname Origins',
    subTabOpenArchives: 'OpenArchives.nl Live',
    subTabPlacesMap: 'Locations & Map',
    subTabPrimarySources: 'Family Tree Resources',
    interactiveMapTitle: 'Interactive Ancestral Geography & Migration Map',
    interactiveMapSubtitle:
      'Click any location pin to inspect Manado, North Sulawesi, Indonesia, East Java, Groningen, and the global family diaspora (free OpenStreetMap tiles, no API key needed).',
    mapFocusAll: 'Fit All Locations',
    mapToggleRoutes: 'Migration Routes',
    mapShowOnMap: 'Locate on Map',
    mapMembersLinked: 'linked members',
    familyResourcesTitle: 'Jacob Lang & Maria Tampemawa — External Research & Archive Resources',
    familyResourcesSubtitle:
      'Curated genealogy portals, colonial almanacs, digital collections, and civil registries documenting the Lang–Tampemawa–Parera–Kuitert lineage.',
    openExternalResource: 'Open Archive',
    refreshLiveApis: 'Refresh Live APIs',

    authTitle: 'Family Archive Account',
    authDescription:
      'Sign in or register to create your own family trees, toggle private access, and invite collaborators. Public visitors view published trees read-only.',
    continueWithGoogle: 'Continue with Google',
    googleFullPageFallback: "Can't click inside popup? Sign in with Google via full page",
    orWithEmail: 'or with email',
    signInTab: 'Sign In',
    registerTab: 'Register',
    fullNameLabel: 'Full Name',
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    signInWithEmail: 'Sign In with Email',
    createFreeAccount: 'Create Free Account',
  },

  id: {
    brandSubtitle: 'Silsilah & Warisan Interaktif',
    brandSubtitleShort: 'Silsilah & Warisan',
    treeGroupsLabel: 'Grup Pohon Keluarga',
    treeGroupSingular: 'Grup Pohon',
    treeGroupPlural: 'Grup Pohon',
    collectionSingular: 'Koleksi',
    collectionPlural: 'Koleksi',
    recordsLabel: 'Catatan',
    bulkImport: 'Impor Massal',
    importExcelUrl: 'Impor Excel / URL',
    newFamilyTree: 'Pohon Keluarga Baru',
    addFamilyTreeGroup: 'Tambah Grup Pohon',
    addMember: 'Tambah Anggota',
    addShort: 'Tambah',
    readOnlyPublic: 'Mode Baca Publik',
    signInRegister: 'Masuk / Daftar',
    signInShort: 'Masuk',
    signOut: 'Keluar',
    superAdmin: 'Super Admin',
    allViewable: 'Semua Terlihat',
    myInvitedTrees: 'Pohon Saya & Undangan',
    activeBadge: 'Aktif',
    publicBadge: 'Publik',
    privateBadge: 'Privat',
    ownerBadge: 'Pemilik',
    collaboratorBadge: 'Kolaborator',
    adminBadge: 'Admin',
    shareButton: 'Bagikan',
    personSingular: 'orang',
    personPlural: 'orang',
    generationSingular: 'Generasi',
    generationPlural: 'Generasi',
    emptyTreeReady: 'Pohon kosong · Siap dibangun',
    startYourOwnLineage: 'Mulai silsilah keluarga Anda',
    createYourOwnTree: 'Buat Pohon Keluarga Anda',
    signInEmailOrGoogle: 'Masuk dengan Email atau Google',
    keyAncestors: 'Leluhur Utama',

    tabTreeChart: 'Bagan Pohon Keluarga',
    tabHeritageApis: 'Warisan, Peta & Sumber',
    tabMembersTable: 'Tabel Anggota',
    tabPhotoArchive: 'Arsip Foto',
    viewingLabel: 'Melihat',
    clickAnyCardToInspect: 'Klik kartu mana saja untuk detail',
    noAncestorsYet: 'Grup pohon keluarga ini belum memiliki anggota.',
    addFoundingAncestor: 'Tambah Leluhur Pendiri',
    onlyOwnerCanAdd: 'Hanya pemilik pohon atau kolaborator yang dapat menambah anggota.',

    footerTagline: 'Platform Silsilah & Warisan Multi-Keluarga',
    allRightsReserved: 'Hak cipta dilindungi.',

    all4Branches: 'Semua 4 Cabang',
    gen1To2: 'Gen I – II',
    gen1To3: 'Gen I – III',
    gen1To4: 'Semua Gen I – IV',
    findInTree: 'Cari di pohon',
    findPersonPlaceholder: 'Cari nama atau pasangan...',
    fullProfile: 'Profil Lengkap',
    detailsAndFamily: 'Detail & Keluarga',
    heritageAndSources: 'Warisan & Sumber',
    bornLabel: 'Lahir',
    diedLabel: 'Wafat',
    marriageLabel: 'Pernikahan',
    occupationLabel: 'Pekerjaan',
    parentsLabel: 'Orang Tua',
    spouseLabel: 'Pasangan',
    spousesLabel: 'Pasangan',
    childrenLabel: 'Anak',
    siblingsLabel: 'Saudara',
    noBirthData: 'Data kelahiran belum tercatat',
    noDeathData: 'Data wafat belum tercatat',
    noOccupationData: 'Pekerjaan belum tercatat',
    noSpouseData: 'Belum ada pasangan tercatat.',
    noChildrenData: 'Belum ada anak tercatat di pohon ini.',
    foundingNoParents: 'Leluhur pendiri — orang tua belum tercatat di arsip.',
    heritageAndBio: 'Warisan & Biografi',
    archivalSourcesAndHints: 'Sumber Arsip & Petunjuk',
    openFullProfileHints: 'Buka Profil Lengkap & Petunjuk OpenArchives',

    backToTree: 'Kembali ke Pohon',
    viewInTree: 'Lihat di Pohon',
    searchArchives: 'Cari Arsip',
    addChild: 'Tambah Anak',
    editLabel: 'Ubah',
    factsTab: 'Fakta',
    hintsTab: 'Petunjuk',
    galleryTab: 'Galeri',
    lifeStoryTab: 'Kisah Hidup',
    heritageTab: 'Warisan',
    ancestralMapLocation: 'Lokasi Leluhur di Peta',
    timelineTitle: 'Peristiwa & Linimasa Kehidupan',
    familyMembersTitle: 'Anggota Keluarga',
    mediaPortraitsTitle: 'Media & Potret',
    uploadPhoto: 'Unggah Foto',

    completeDirectory: 'Direktori Lengkap Keluarga',
    exportCsv: 'Ekspor CSV',
    searchDirectoryPlaceholder: 'Cari nama, pasangan, tempat lahir, pekerjaan, atau warisan...',
    allGenerations: 'Semua Generasi',
    allBranches: 'Semua Cabang',
    ancestorCol: 'Anggota',
    codeGenCol: 'Kode & Gen',
    lifespanPlaceCol: 'Masa Hidup & Tempat',
    occupationHeritageCol: 'Pekerjaan & Warisan',
    actionsCol: 'Aksi',
    viewProfile: 'Profil',
    locateInTree: 'Pohon',

    subTabOrigins: 'Asal Marga',
    subTabOpenArchives: 'OpenArchives.nl Langsung',
    subTabPlacesMap: 'Lokasi & Peta',
    subTabPrimarySources: 'Sumber Pohon Keluarga',
    interactiveMapTitle: 'Peta Geografi & Migrasi Leluhur Interaktif',
    interactiveMapSubtitle:
      'Klik pin lokasi mana saja untuk melihat Manado, Sulawesi Utara, Indonesia, Jawa Timur, Groningen, dan diaspora keluarga (peta gratis OpenStreetMap, tanpa API key).',
    mapFocusAll: 'Tampilkan Semua Lokasi',
    mapToggleRoutes: 'Rute Migrasi',
    mapShowOnMap: 'Lihat di Peta',
    mapMembersLinked: 'anggota terkait',
    familyResourcesTitle: 'Keluarga Jacob Lang & Maria Tampemawa — Sumber Riset & Arsip',
    familyResourcesSubtitle:
      'Portal silsilah terkurasi, almanak kolonial, koleksi digital, dan catatan sipil yang mendokumentasikan garis keturunan Lang–Tampemawa–Parera–Kuitert.',
    openExternalResource: 'Buka Arsip',
    refreshLiveApis: 'Segarkan API',

    authTitle: 'Akun Family Archive',
    authDescription:
      'Masuk atau daftar untuk membuat pohon keluarga sendiri, mengatur akses privat, dan mengundang kolaborator. Pengunjung publik hanya dapat melihat tanpa mengedit.',
    continueWithGoogle: 'Lanjutkan dengan Google',
    googleFullPageFallback: 'Tidak bisa klik di popup? Masuk dengan Google lewat halaman penuh',
    orWithEmail: 'atau dengan email',
    signInTab: 'Masuk',
    registerTab: 'Daftar',
    fullNameLabel: 'Nama Lengkap',
    emailLabel: 'Alamat Email',
    passwordLabel: 'Kata Sandi',
    signInWithEmail: 'Masuk dengan Email',
    createFreeAccount: 'Buat Akun Gratis',
  },

  nl: {
    brandSubtitle: 'Interactieve Genealogie & Erfgoed',
    brandSubtitleShort: 'Genealogie & Erfgoed',
    treeGroupsLabel: 'Stamboomgroepen',
    treeGroupSingular: 'Stamboom',
    treeGroupPlural: 'Stambomen',
    collectionSingular: 'Collectie',
    collectionPlural: 'Collecties',
    recordsLabel: 'Akten',
    bulkImport: 'Bulk Importeren',
    importExcelUrl: 'Excel / URL Importeren',
    newFamilyTree: 'Nieuwe Stamboom',
    addFamilyTreeGroup: 'Stamboom Toevoegen',
    addMember: 'Persoon Toevoegen',
    addShort: 'Nieuw',
    readOnlyPublic: 'Openbare Alleen-Lezen Weergave',
    signInRegister: 'Inloggen / Registreren',
    signInShort: 'Inloggen',
    signOut: 'Uitloggen',
    superAdmin: 'Super Admin',
    allViewable: 'Alle Zichtbaar',
    myInvitedTrees: 'Mijn & Gedeelde Stambomen',
    activeBadge: 'Actief',
    publicBadge: 'Openbaar',
    privateBadge: 'Privé',
    ownerBadge: 'Eigenaar',
    collaboratorBadge: 'Medewerker',
    adminBadge: 'Beheerder',
    shareButton: 'Delen',
    personSingular: 'persoon',
    personPlural: 'personen',
    generationSingular: 'Generatie',
    generationPlural: 'Generaties',
    emptyTreeReady: 'Lege stamboom · Klaar om te bouwen',
    startYourOwnLineage: 'Start uw eigen familiestamboom',
    createYourOwnTree: 'Maak Uw Eigen Stamboom',
    signInEmailOrGoogle: 'Log in met e-mail of Google',
    keyAncestors: 'Stamouders',

    tabTreeChart: 'Stamboomschema',
    tabHeritageApis: 'Erfgoed, Kaart & Bronnen',
    tabMembersTable: 'Personenlijst',
    tabPhotoArchive: 'Fotoarchief',
    viewingLabel: 'Weergave',
    clickAnyCardToInspect: 'Klik op een kaart voor details',
    noAncestorsYet: 'Deze stamboom heeft nog geen voorouders.',
    addFoundingAncestor: 'Stamouder Toevoegen',
    onlyOwnerCanAdd: 'Alleen de eigenaar of medewerkers kunnen personen toevoegen.',

    footerTagline: 'Multi-Familie Genealogie & Erfgoed Platform',
    allRightsReserved: 'Alle rechten voorbehouden.',

    all4Branches: 'Alle 4 Takken',
    gen1To2: 'Gen I – II',
    gen1To3: 'Gen I – III',
    gen1To4: 'Alle Gen I – IV',
    findInTree: 'Zoek in stamboom',
    findPersonPlaceholder: 'Zoek persoon of partner...',
    fullProfile: 'Volledig Profiel',
    detailsAndFamily: 'Gegevens & Familie',
    heritageAndSources: 'Erfgoed & Bronnen',
    bornLabel: 'Geboren',
    diedLabel: 'Overleden',
    marriageLabel: 'Huwelijk',
    occupationLabel: 'Beroep',
    parentsLabel: 'Ouders',
    spouseLabel: 'Partner',
    spousesLabel: 'Partners',
    childrenLabel: 'Kinderen',
    siblingsLabel: 'Broers & Zussen',
    noBirthData: 'Geen geboortegegevens bekend',
    noDeathData: 'Geen overlijdensgegevens bekend',
    noOccupationData: 'Geen beroep geregistreerd',
    noSpouseData: 'Geen partner geregistreerd.',
    noChildrenData: 'Nog geen kinderen geregistreerd.',
    foundingNoParents: 'Stamouder — geen ouders in het archief vermeld.',
    heritageAndBio: 'Erfgoed & Biografie',
    archivalSourcesAndHints: 'Archiefbronnen & Aanwijzingen',
    openFullProfileHints: 'Open Volledig Profiel & OpenArchives',

    backToTree: 'Terug naar Stamboom',
    viewInTree: 'Toon in Stamboom',
    searchArchives: 'Zoek Archieven',
    addChild: 'Kind Toevoegen',
    editLabel: 'Bewerken',
    factsTab: 'Feiten',
    hintsTab: 'Bronhints',
    galleryTab: 'Galerij',
    lifeStoryTab: 'Levensverhaal',
    heritageTab: 'Erfgoed',
    ancestralMapLocation: 'Voorouderlijke Locatie op Kaart',
    timelineTitle: 'Levensgebeurtenissen & Tijdlijn',
    familyMembersTitle: 'Familieleden',
    mediaPortraitsTitle: 'Media & Portretten',
    uploadPhoto: 'Foto Uploaden',

    completeDirectory: 'Volledig Persoonsregister',
    exportCsv: 'CSV Exporteren',
    searchDirectoryPlaceholder: 'Zoek naam, partner, geboorteplaats, beroep of erfgoed...',
    allGenerations: 'Alle Generaties',
    allBranches: 'Alle Takken',
    ancestorCol: 'Persoon',
    codeGenCol: 'Code & Gen',
    lifespanPlaceCol: 'Levensjaren & Plaats',
    occupationHeritageCol: 'Beroep & Erfgoed',
    actionsCol: 'Acties',
    viewProfile: 'Profiel',
    locateInTree: 'Stamboom',

    subTabOrigins: 'Familienamen',
    subTabOpenArchives: 'OpenArchives.nl Live',
    subTabPlacesMap: 'Locaties & Kaart',
    subTabPrimarySources: 'Stamboombronnen',
    interactiveMapTitle: 'Interactieve Voorouderlijke Geografie- & Migratiekaart',
    interactiveMapSubtitle:
      'Klik op een locatiepin om Manado (Noord-Sulawesi, Indonesië), Oost-Java, Groningen en de wereldwijde diaspora te verkennen (gratis OpenStreetMap-kaarten, geen API-sleutel nodig).',
    mapFocusAll: 'Toon Alle Locaties',
    mapToggleRoutes: 'Migratieroutes',
    mapShowOnMap: 'Toon op Kaart',
    mapMembersLinked: 'gekoppelde familieleden',
    familyResourcesTitle: 'Familie Jacob Lang & Maria Tampemawa — Onderzoeks- & Archiefbronnen',
    familyResourcesSubtitle:
      'Geselecteerde genealogieportalen, regeringsalmanakken, digitale collecties en burgerlijke standen over de parenteel Lang–Tampemawa–Parera–Kuitert.',
    openExternalResource: 'Open Archief',
    refreshLiveApis: 'Ververs API’s',

    authTitle: 'Family Archive Account',
    authDescription:
      'Log in of registreer om uw eigen stambomen te maken, privétoegang in te stellen en medewerkers uit te nodigen. Openbare bezoekers hebben alleen-lezen toegang.',
    continueWithGoogle: 'Doorgaan met Google',
    googleFullPageFallback: 'Kun je niet klikken in de pop-up? Log in via volledige pagina',
    orWithEmail: 'of met e-mail',
    signInTab: 'Inloggen',
    registerTab: 'Registreren',
    fullNameLabel: 'Volledige Naam',
    emailLabel: 'E-mailadres',
    passwordLabel: 'Wachtwoord',
    signInWithEmail: 'Inloggen met E-mail',
    createFreeAccount: 'Gratis Account Aanmaken',
  },
};

/**
 * Translates dynamic genealogy/archive prose, place names, relationship labels,
 * heritage tags, occupations, and archival categories into Indonesian (id) or Dutch (nl).
 */
export function translateArchiveContent(text: string | undefined, locale: AppLocale): string {
  if (!text) return '';
  if (locale === 'en') return text;

  let out = text;

  const replacements: Array<[RegExp, string]> =
    locale === 'id'
      ? [
          [/\bNorth Sulawesi,\s*Indonesia\b/gi, 'Sulawesi Utara, Indonesia'],
          [/\bSouth Sulawesi,\s*Indonesia\b/gi, 'Sulawesi Selatan, Indonesia'],
          [/\bEast Java,\s*Indonesia\b/gi, 'Jawa Timur, Indonesia'],
          [/\bWest Java,\s*Indonesia\b/gi, 'Jawa Barat, Indonesia'],
          [/\bCentral Java,\s*Indonesia\b/gi, 'Jawa Tengah, Indonesia'],
          [/\bSouth Sumatra,\s*Indonesia\b/gi, 'Sumatera Selatan, Indonesia'],
          [/\bNorth Maluku,\s*Indonesia\b/gi, 'Maluku Utara, Indonesia'],
          [/\bSouth Holland,\s*Netherlands\b/gi, 'Holland Selatan, Belanda'],
          [/\bNorth Holland,\s*Netherlands\b/gi, 'Holland Utara, Belanda'],
          [/\bGroningen,\s*Groningen,\s*Netherlands\b/gi, 'Groningen, Belanda'],
          [/\bThe Hague\b/gi, 'Den Haag'],
          [/\bNetherlands\b/gi, 'Belanda'],
          [/\bUnited States\b/gi, 'Amerika Serikat'],
          [/\bCanada\b/gi, 'Kanada'],
          [/\bDutch East Indies\b/gi, 'Hindia Belanda'],
          [/\bFounding Patriarch\b/gi, 'Leluhur Pendiri'],
          [/\bFounding Ancestor\b/gi, 'Leluhur Pendiri'],
          [/\bGreat-granddaughter of\b/gi, 'Cicit perempuan dari'],
          [/\bGreat-grandson of\b/gi, 'Cicit laki-laki dari'],
          [/\bGranddaughter of\b/gi, 'Cucu perempuan dari'],
          [/\bGrandson of\b/gi, 'Cucu laki-laki dari'],
          [/\bDaughter of\b/gi, 'Putri dari'],
          [/\bSon of\b/gi, 'Putra dari'],
          [/\bMarried to\b/gi, 'Menikah dengan'],
          [/\bSpouse of\b/gi, 'Pasangan dari'],
          [/\bGeneration\b/g, 'Generasi'],
          [/\bDescendant\b/gi, 'Keturunan'],
          [/\bCivil Registry\b/gi, 'Catatan Sipil'],
          [/\bPassenger List\b/gi, 'Daftar Penumpang'],
          [/\bGravestone\b/gi, 'Batu Nisan'],
          [/\bDirectory\b/gi, 'Direktori'],
          [/\bWar Grave\b/gi, 'Makam Perang'],
          [/\bNaturalization\b/gi, 'Naturalisasi'],
          [/\bVOC Voyage\b/gi, 'Pelayaran VOC'],
          [/\bSea Captain\b/gi, 'Kapten Kapal'],
          [/\bMaster Carpenter\b/gi, 'Ahli Kayu'],
          [/\bState Railways\b/gi, 'Kereta Api Negara (SS)'],
          [/\bNutmeg Plantation\b/gi, 'Perkebunan Pala'],
          [/\bIndo-Minahasan\b/gi, 'Indo-Minahasa'],
          [/\bMinahasan\b/gi, 'Minahasa'],
          [/\bFamily\b/g, 'Keluarga'],
          [/\bBorn\b/g, 'Lahir'],
          [/\bDied\b/g, 'Wafat'],
          [/\bBuried at\b/gi, 'Dimakamkan di'],
          [/\bParenteel\b/g, 'Silsilah'],
          [/\bEst\.\b/g, 'Sejak'],
        ]
      : [
          [/\bNorth Sulawesi,\s*Indonesia\b/gi, 'Noord-Sulawesi, Indonesië'],
          [/\bSouth Sulawesi,\s*Indonesia\b/gi, 'Zuid-Sulawesi, Indonesië'],
          [/\bEast Java,\s*Indonesia\b/gi, 'Oost-Java, Indonesië'],
          [/\bWest Java,\s*Indonesia\b/gi, 'West-Java, Indonesië'],
          [/\bCentral Java,\s*Indonesia\b/gi, 'Midden-Java, Indonesië'],
          [/\bSouth Sumatra,\s*Indonesia\b/gi, 'Zuid-Sumatra, Indonesië'],
          [/\bNorth Maluku,\s*Indonesia\b/gi, 'Noord-Molukken, Indonesië'],
          [/\bMaluku,\s*Indonesia\b/gi, 'Molukken, Indonesië'],
          [/\bIndonesia\b/gi, 'Indonesië'],
          [/\bSouth Holland,\s*Netherlands\b/gi, 'Zuid-Holland, Nederland'],
          [/\bNorth Holland,\s*Netherlands\b/gi, 'Noord-Holland, Nederland'],
          [/\bGroningen,\s*Groningen,\s*Netherlands\b/gi, 'Groningen, Nederland'],
          [/\bThe Hague\b/gi, 'Den Haag'],
          [/\bNetherlands\b/gi, 'Nederland'],
          [/\bUnited States\b/gi, 'Verenigde Staten'],
          [/\bDutch East Indies\b/gi, 'Nederlands-Indië'],
          [/\bFounding Patriarch\b/gi, 'Stamvader'],
          [/\bFounding Ancestor\b/gi, 'Stamouder'],
          [/\bGreat-granddaughter of\b/gi, 'Achterkleindochter van'],
          [/\bGreat-grandson of\b/gi, 'Achterkleinzoon van'],
          [/\bGranddaughter of\b/gi, 'Kleindochter van'],
          [/\bGrandson of\b/gi, 'Kleinzoon van'],
          [/\bDaughter of\b/gi, 'Dochter van'],
          [/\bSon of\b/gi, 'Zoon van'],
          [/\bMarried to\b/gi, 'Gehuwd met'],
          [/\bSpouse of\b/gi, 'Echtgenoot/echtgenote van'],
          [/\bGeneration\b/g, 'Generatie'],
          [/\bDescendant\b/gi, 'Nakomeling'],
          [/\bCivil Registry\b/gi, 'Burgerlijke Stand'],
          [/\bPassenger List\b/gi, 'Passagierslijst'],
          [/\bGravestone\b/gi, 'Grafsteen'],
          [/\bDirectory\b/gi, 'Adresboek / Almanak'],
          [/\bWar Grave\b/gi, 'Oorlogsgraf'],
          [/\bNaturalization\b/gi, 'Naturalisatie'],
          [/\bVOC Voyage\b/gi, 'VOC-reis'],
          [/\bSea Captain\b/gi, 'Zeekapitein'],
          [/\bMaster Carpenter\b/gi, 'Meester-timmerman'],
          [/\bState Railways\b/gi, 'Staatsspoorwegen (SS)'],
          [/\bNutmeg Plantation\b/gi, 'Nootmuskaatplantage'],
          [/\bFamily\b/g, 'Familie'],
          [/\bBorn\b/g, 'Geboren'],
          [/\bDied\b/g, 'Overleden'],
          [/\bBuried at\b/gi, 'Begraven te'],
          [/\bEst\.\b/g, 'Sinds'],
        ];

  for (const [pattern, replacement] of replacements) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
