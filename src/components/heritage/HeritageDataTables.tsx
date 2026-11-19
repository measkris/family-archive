'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Archive,
  BookOpen,
  Compass,
  Download,
  ExternalLink,
  FileCheck2,
  Globe2,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  FAMILY_TREE_RESOURCES,
  type ArchivalSourceRecord,
  type FamilyMemberRecord,
} from '@/lib/data/lang-genealogy';
import type { HeritageOriginRecord } from '@/lib/db/types';
import type { OpenArchiveRecord } from '@/app/api/heritage/openarchives/route';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { Badge } from '@/components/ui/badge';

const AncestralLocationsMap = dynamic(
  () => import('@/components/heritage/AncestralLocationsMap').then((m) => m.AncestralLocationsMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[380px] sm:h-[440px] w-full rounded-xl" />,
  }
);
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface HeritagePlaceApiRow {
  id: string;
  placeName: string;
  province?: string;
  historicalName: string;
  country: string;
  eraInTree: string;
  generationsPresent: string;
  familyConnection: string;
  wikiTitle: string;
  description?: string;
  extract: string;
  coordinates: { lat: number; lon: number } | null;
  wikipediaUrl: string;
  thumbnail: string | null;
}

interface HeritageDataTablesProps {
  initialOrigins: HeritageOriginRecord[];
  archivalRecords: ArchivalSourceRecord[];
  members: FamilyMemberRecord[];
  onSelectMemberById: (memberId: string) => void;
}

const COUNTRY_NAMES: Record<string, string> = {
  NL: 'Netherlands',
  ID: 'Indonesia',
  DE: 'Germany',
  BE: 'Belgium',
  GB: 'United Kingdom',
  US: 'United States',
  CA: 'Canada',
  FR: 'France',
  PT: 'Portugal',
  AT: 'Austria',
  CH: 'Switzerland',
  AU: 'Australia',
  ES: 'Spain',
  IN: 'India',
  LK: 'Sri Lanka',
  CN: 'China',
  MY: 'Malaysia',
  SG: 'Singapore',
  ZA: 'South Africa',
};

const QUICK_ARCHIVE_QUERIES = [
  'Jan Wolters Kuitert',
  'Jacob Lang',
  'Joseph Lang',
  'Hendrik Lang',
  'Weintre',
  'Uijtenbroeck',
  'Willemsen',
  'Engelen',
];

export function HeritageDataTables({
  initialOrigins,
  archivalRecords,
  members,
  onSelectMemberById,
}: HeritageDataTablesProps) {
  const { t, tc } = useLanguage();
  // Active sub-tab for lazy on-demand API fetching
  const [subTab, setSubTab] = useState<'origins' | 'openarchives' | 'places' | 'sources'>('places');
  const [focusedPlaceId, setFocusedPlaceId] = useState<string | null>(null);

  // 1. Surname Heritage Origins (Nationalize.io + OpenArchives + Wikipedia)
  const [origins, setOrigins] = useState<HeritageOriginRecord[]>(initialOrigins);
  const [enrichingOrigins, setEnrichingOrigins] = useState(false);
  const [originFilter, setOriginFilter] = useState('all');

  // 2. Live OpenArchives.nl Search Table
  const [oaQuery, setOaQuery] = useState('Jan Wolters Kuitert');
  const [oaRecords, setOaRecords] = useState<OpenArchiveRecord[]>([]);
  const [oaTotal, setOaTotal] = useState<number>(0);
  const [oaLoading, setOaLoading] = useState(false);
  const [oaLoadedOnce, setOaLoadedOnce] = useState(false);
  const [oaFetchedAt, setOaFetchedAt] = useState<string>('');

  // 3. Ancestral Places (Wikipedia REST API)
  const [places, setPlaces] = useState<HeritagePlaceApiRow[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesLoadedOnce, setPlacesLoadedOnce] = useState(false);

  // 4. BrouwerTree Primary Sources Index
  const [archiveCategory, setArchiveCategory] = useState('all');
  const [archiveSearch, setArchiveSearch] = useState('');

  const enrichOrigins = useCallback(async (forceRefresh = false) => {
    setEnrichingOrigins(true);
    try {
      const res = await fetch(
        `/api/heritage/origins?enrich=true${forceRefresh ? '&refresh=true' : ''}`
      );
      const json = await res.json();
      if (Array.isArray(json.origins)) {
        setOrigins(json.origins);
      }
    } catch (e) {
      console.error('Failed to enrich heritage origins:', e);
    } finally {
      setEnrichingOrigins(false);
    }
  }, []);

  const searchOpenArchives = useCallback(async (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;
    setOaLoading(true);
    try {
      const res = await fetch(
        `/api/heritage/openarchives?q=${encodeURIComponent(q)}&limit=20`
      );
      const json = await res.json();
      setOaRecords(Array.isArray(json.records) ? json.records : []);
      setOaTotal(Number(json.totalFound || 0));
      setOaFetchedAt(json.fetchedAt || '');
    } catch (e) {
      console.error('OpenArchives fetch error:', e);
    } finally {
      setOaLoading(false);
    }
  }, []);

  const loadPlaces = useCallback(async () => {
    setPlacesLoading(true);
    try {
      const res = await fetch('/api/heritage/places');
      const json = await res.json();
      if (Array.isArray(json.places)) {
        setPlaces(json.places);
      }
    } catch (e) {
      console.error('Wikipedia places fetch error:', e);
    } finally {
      setPlacesLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadInitialData() {
      // Load ancestral places for the default Locations & Map sub-tab
      try {
        const placesRes = await fetch('/api/heritage/places');
        const placesJson = await placesRes.json();
        if (!cancelled && Array.isArray(placesJson.places)) {
          setPlaces(placesJson.places);
          setPlacesLoadedOnce(true);
        }
      } catch {
        // non-fatal
      }

      const needsEnrich = initialOrigins.some(
        (o) => !o.lastEnrichedAt || o.openArchivesCount === undefined
      );
      if (!needsEnrich) return;
      try {
        const res = await fetch('/api/heritage/origins?enrich=true');
        const json = await res.json();
        if (!cancelled && Array.isArray(json.origins)) {
          setOrigins(json.origins);
        }
      } catch {
        // non-fatal
      }
    }
    void loadInitialData();
    return () => {
      cancelled = true;
    };
  }, [initialOrigins]);

  // Lazy-load OpenArchives & Wikipedia on demand when switching tabs
  const handleSubTabChange = useCallback(
    (nextTab: 'origins' | 'openarchives' | 'places' | 'sources') => {
      setSubTab(nextTab);
      if (nextTab === 'openarchives' && !oaLoadedOnce) {
        setOaLoadedOnce(true);
        searchOpenArchives(oaQuery);
      }
      if (nextTab === 'places' && !placesLoadedOnce) {
        setPlacesLoadedOnce(true);
        loadPlaces();
      }
    },
    [oaLoadedOnce, placesLoadedOnce, oaQuery, searchOpenArchives, loadPlaces]
  );

  const filteredOrigins = useMemo(() => {
    if (originFilter === 'all') return origins;
    return origins.filter((o) => o.heritageGroup === originFilter);
  }, [origins, originFilter]);

  const filteredArchives = useMemo(() => {
    const q = archiveSearch.trim().toLowerCase();
    return archivalRecords.filter((a) => {
      if (archiveCategory !== 'all' && a.category !== archiveCategory) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.sourceCitation.toLowerCase().includes(q) ||
        a.personNames.some((p) => p.toLowerCase().includes(q))
      );
    });
  }, [archivalRecords, archiveCategory, archiveSearch]);

  function exportOriginsCsv() {
    const headers = [
      'Surname',
      'Heritage Group',
      'Ancestral Region',
      'First Appearance',
      'Notable Members',
      'Nationalize.io Top Countries',
      'OpenArchives Records Count',
      'Historical Context',
    ];
    const rows = filteredOrigins.map((o) => [
      o.surname,
      o.heritageGroup,
      o.ancestralRegion,
      `${o.firstAppearanceGen} (${o.firstAppearanceYear})`,
      o.notableMembers,
      (o.nationalizeCountries || [])
        .map((c) => `${COUNTRY_NAMES[c.country_id] || c.country_id} (${Math.round(c.probability * 100)}%)`)
        .join('; '),
      o.openArchivesCount !== undefined ? String(o.openArchivesCount) : 'N/A',
      o.historicalContext,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lang-tampemawa-heritage-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Executive Heritage Synthesis Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        <Card className="bg-gradient-to-br from-[#0b4a68] to-[#173954] text-white border-0">
          <CardHeader className="pb-2">
            <CardDescription className="text-sky-200 text-xs uppercase tracking-wider font-semibold">
              Primary Cultural Synthesis
            </CardDescription>
            <CardTitle className="font-heritage text-2xl text-white">
              Indo-Minahasan
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-sky-100/90 leading-relaxed">
            Born from the union of <strong>Jacob Lang</strong> (VOC-era European lineage in Manado)
            and <strong>Maria Tampemawa</strong> (Minahasan, North Sulawesi), married 12 May 1842.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold text-amber-800">
              Allied Clans & Nations
            </CardDescription>
            <CardTitle className="font-heritage text-2xl">5 Heritage Streams</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed">
            <strong>Minahasan</strong> (Tampemawa, Waworuntu, Mamahit, Ransun, Mogot),{' '}
            <strong>Dutch</strong> (Kuitert of Groningen, Engelen, Uijtenbroeck),{' '}
            <strong>Luso-Moluccan</strong> (Parera), & <strong>English-Indisch</strong> (Weintre).
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold text-emerald-800">
              Geographic Diaspora
            </CardDescription>
            <CardTitle className="font-heritage text-2xl">4 Continents</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed">
            Manado · Kema · Tondano · Gorontalo → East/West Java (Malang, Blitar, Bandung) →
            Netherlands (The Hague, Amsterdam) → Canada (Calgary) & USA (Michigan, PA, FL).
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold text-[#0b4a68]">
              Live Connected Data APIs
            </CardDescription>
            <CardTitle className="font-heritage text-2xl">3 Public APIs</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed">
            Live queries to <strong>OpenArchives.nl</strong> (Dutch/Indies civil archives),{' '}
            <strong>Nationalize.io</strong> (surname origin statistics), and{' '}
            <strong>Wikipedia REST v1</strong> (historical places).
          </CardContent>
        </Card>
      </div>

      {/* Interactive Heritage API Data Tables */}
      <Tabs
        value={subTab}
        onValueChange={(v) => handleSubTabChange(v as typeof subTab)}
        className="w-full animate-slide-up"
      >
        <TabsList className="w-full justify-start overflow-x-auto no-scrollbar h-auto flex-wrap p-1.5 gap-1">
          <TabsTrigger value="places">
            <Compass className="size-4" /> {t.subTabPlacesMap}
          </TabsTrigger>
          <TabsTrigger value="sources">
            <BookOpen className="size-4" /> {t.subTabPrimarySources} ({archivalRecords.length + FAMILY_TREE_RESOURCES.length})
          </TabsTrigger>
          <TabsTrigger value="origins">
            <Globe2 className="size-4" /> {t.subTabOrigins} ({origins.length})
          </TabsTrigger>
          <TabsTrigger value="openarchives">
            <Archive className="size-4" /> {t.subTabOpenArchives}
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Surname Heritage & Nationalize.io + OpenArchives + Wikipedia */}
        <TabsContent value="origins">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="font-heritage text-2xl flex items-center gap-2">
                    Generational Surname Heritage Matrix
                    <Badge variant="maritime" className="font-sans text-[11px]">
                      Live API Enriched + DB Cached
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Combines ethnolinguistic genealogy from the Lang–Tampemawa tree with live
                    Nationalize.io probability estimates and OpenArchives.nl Dutch/Indies archive
                    record counts.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Select value={originFilter} onValueChange={setOriginFilter}>
                    <SelectTrigger className="h-8 w-[205px] text-xs">
                      <SelectValue placeholder="Filter heritage group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Heritage Groups</SelectItem>
                      <SelectItem value="Minahasan (North Sulawesi)">
                        Minahasan (North Sulawesi)
                      </SelectItem>
                      <SelectItem value="Dutch / Germanic">Dutch / Germanic</SelectItem>
                      <SelectItem value="Indo-European (N.O.I.)">Indo-European (N.O.I.)</SelectItem>
                      <SelectItem value="Moluccan-Portuguese">Moluccan-Portuguese</SelectItem>
                      <SelectItem value="English-Indisch">English-Indisch</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => enrichOrigins(true)}
                    disabled={enrichingOrigins}
                  >
                    {enrichingOrigins ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="size-3.5" />
                    )}
                    Sync Live APIs
                  </Button>
                  <Button size="sm" variant="outline" onClick={exportOriginsCsv}>
                    <Download className="size-3.5" /> CSV
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Family Surname</TableHead>
                    <TableHead>Heritage Group & Region</TableHead>
                    <TableHead>Tree Appearance</TableHead>
                    <TableHead>Nationalize.io API Origin Signal</TableHead>
                    <TableHead>OpenArchives.nl Matches</TableHead>
                    <TableHead>Historical & Cultural Context</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrigins.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="font-heritage text-lg font-bold text-foreground">
                          {row.surname}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 max-w-[180px]">
                          {row.notableMembers}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            row.heritageGroup.includes('Minahasan')
                              ? 'emerald'
                              : row.heritageGroup.includes('Dutch')
                              ? 'maritime'
                              : 'gold'
                          }
                          className="mb-1"
                        >
                          {row.heritageGroup}
                        </Badge>
                        <div className="text-xs text-muted-foreground max-w-[210px]">
                          {row.ancestralRegion}
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        <div className="text-xs font-medium">{row.firstAppearanceGen}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          ca. {row.firstAppearanceYear}
                        </div>
                      </TableCell>

                      <TableCell className="min-w-[195px]">
                        {row.nationalizeCountries && row.nationalizeCountries.length > 0 ? (
                          <div className="space-y-1.5">
                            {row.nationalizeCountries.slice(0, 3).map((c) => {
                              const pct = Math.round(c.probability * 100);
                              return (
                                <div key={c.country_id} className="space-y-0.5">
                                  <div className="flex justify-between text-[11px]">
                                    <span className="font-medium">
                                      {COUNTRY_NAMES[c.country_id] || c.country_id}
                                    </span>
                                    <span className="font-mono text-muted-foreground">{pct}%</span>
                                  </div>
                                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-[#0b4a68]"
                                      style={{ width: `${Math.max(pct, 4)}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            {enrichingOrigins
                              ? 'Querying Nationalize.io...'
                              : 'Regional indigenous surname (not in global census API)'}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {row.openArchivesCount !== undefined ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSubTab('openarchives');
                              setOaQuery(row.surname);
                              setOaLoadedOnce(true);
                              searchOpenArchives(row.surname);
                            }}
                            className="inline-flex flex-col items-start hover:underline cursor-pointer"
                          >
                            <span className="font-mono text-sm font-bold text-[#0b4a68]">
                              {row.openArchivesCount.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Dutch archive records
                            </span>
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="max-w-[300px]">
                        <p className="text-xs leading-relaxed text-foreground/85">
                          {row.historicalContext}
                        </p>
                        {row.wikipediaUrl && (
                          <a
                            href={row.wikipediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0b4a68] hover:underline mt-1"
                          >
                            Wikipedia Heritage Article <ExternalLink className="size-3" />
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Live OpenArchives.nl Genealogy API Table */}
        <TabsContent value="openarchives">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="font-heritage text-2xl flex items-center gap-2">
                    Live Dutch & Colonial Civil Archives
                    <Badge variant="emerald" className="font-sans text-[11px]">
                      api.openarch.nl/1.0
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Real-time query against OpenArchives.nl (Dutch municipal registries, Groningen
                    vital certificates, VOC & colonial population registers).
                  </CardDescription>
                </div>
                {oaTotal > 0 && (
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-[#0b4a68]">
                      {oaTotal.toLocaleString()} matches
                    </div>
                    {oaFetchedAt && (
                      <div className="text-[11px] text-muted-foreground">
                        Live API · showing top {oaRecords.length}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Search Bar + Preset Chips */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  searchOpenArchives(oaQuery);
                }}
                className="flex flex-wrap items-center gap-2 pt-3"
              >
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={oaQuery}
                    onChange={(e) => setOaQuery(e.target.value)}
                    placeholder="Search ancestor name in OpenArchives.nl (e.g. Jan Wolters Kuitert)..."
                    className="pl-9"
                  />
                </div>
                <Button type="submit" disabled={oaLoading}>
                  {oaLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Search className="size-4" />
                  )}
                  Query Live API
                </Button>
              </form>

              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <span className="text-[11px] text-muted-foreground mr-1">Quick tree queries:</span>
                {QUICK_ARCHIVE_QUERIES.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setOaQuery(chip);
                      searchOpenArchives(chip);
                    }}
                    className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors cursor-pointer ${
                      oaQuery === chip
                        ? 'bg-[#0b4a68] text-white border-[#0b4a68]'
                        : 'bg-background hover:bg-muted border-border text-foreground'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {oaLoading ? (
                <div className="p-4 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pb-1">
                    <Loader2 className="size-3.5 animate-spin text-[#0b4a68]" />
                    Querying live certificates from OpenArchives.nl...
                  </div>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-12 items-center gap-3 py-2.5 border-b border-border/50"
                    >
                      <div className="col-span-3 space-y-1.5">
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="col-span-2 h-5 w-24 rounded-full" />
                      <Skeleton className="col-span-2 h-3.5 w-20" />
                      <Skeleton className="col-span-2 h-3.5 w-28" />
                      <Skeleton className="col-span-2 h-3.5 w-32" />
                      <Skeleton className="col-span-1 h-7 w-16 ml-auto" />
                    </div>
                  ))}
                </div>
              ) : oaRecords.length === 0 ? (
                <div className="py-14 text-center text-sm text-muted-foreground">
                  No live archive records found for &ldquo;{oaQuery}&rdquo;. Try one of the Dutch or
                  colonial surnames above.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recorded Name & Role</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Archive Institution</TableHead>
                      <TableHead className="text-right">Certificate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {oaRecords.map((rec) => (
                      <TableRow key={rec.id}>
                        <TableCell>
                          <div className="font-medium text-sm text-foreground">
                            {rec.personName}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Role: {rec.relationType}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="gold">{rec.eventType}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {rec.eventDate}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3 text-muted-foreground shrink-0" />
                            {rec.eventPlace}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[230px]">
                          <div>{rec.archiveName}</div>
                          <div className="text-[10px] opacity-80">{rec.sourceType}</div>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <a
                            href={rec.recordUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-[#0b4a68] hover:bg-muted"
                          >
                            {rec.hasScan && (
                              <FileCheck2 className="size-3.5 text-emerald-700" aria-label="Scan available" />
                            )}
                            Inspect <ExternalLink className="size-3" />
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Ancestral Homelands (Wikipedia REST API v1) */}
        <TabsContent value="places">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="font-heritage text-2xl flex items-center gap-2">
                    Ancestral Homelands & Migration Atlas
                    <Badge variant="maritime" className="font-sans text-[11px]">
                      Wikipedia REST API v1
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Historical regions shaping Generations I–IV, enriched live from Wikipedia with
                    coordinates and family connections.
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={loadPlaces} disabled={placesLoading}>
                  {placesLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="size-3.5" />
                  )}
                  Refresh
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0 space-y-4">
              {/* Interactive Free Leaflet + OpenStreetMap / CartoDB Ancestral Locations Map */}
              <div className="px-4 sm:px-6 pt-2 pb-1 space-y-2 border-b border-border/70">
                <div>
                  <h3 className="font-heritage text-xl font-bold text-foreground flex items-center gap-2">
                    <MapPin className="size-5 text-[#73a922]" />
                    {t.interactiveMapTitle}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.interactiveMapSubtitle}
                  </p>
                </div>
                <AncestralLocationsMap
                  members={members}
                  focusedLocationId={focusedPlaceId}
                  onSelectMemberById={onSelectMemberById}
                />
              </div>

              {placesLoading && places.length === 0 ? (
                <div className="p-4 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pb-1">
                    <Loader2 className="size-3.5 animate-spin text-[#0b4a68]" />
                    Loading ancestral geography from Wikipedia REST API...
                  </div>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-12 items-center gap-4 py-3 border-b border-border/50"
                    >
                      <div className="col-span-3 flex items-center gap-3">
                        <Skeleton className="size-12 rounded-lg shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-4 w-4/5" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                      <Skeleton className="col-span-2 h-4 w-5/6" />
                      <Skeleton className="col-span-2 h-5 w-24 rounded-full" />
                      <div className="col-span-2 space-y-1.5">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-4/5" />
                      </div>
                      <div className="col-span-3 space-y-1.5">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-11/12" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location & Visual</TableHead>
                      <TableHead>Historical Colonial Name</TableHead>
                      <TableHead>Era & Generations</TableHead>
                      <TableHead>Lang–Tampemawa Connection</TableHead>
                      <TableHead>Live Wikipedia Historical Summary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {places.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="min-w-[200px]">
                          <div className="flex items-center gap-3">
                            {p.thumbnail ? (
                              <img
                                src={p.thumbnail}
                                alt={p.placeName}
                                className="size-12 rounded-lg object-cover border border-border shrink-0"
                              />
                            ) : (
                              <div className="size-12 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                                <MapPin className="size-5" />
                              </div>
                            )}
                            <div>
                              <div className="font-heritage text-base font-bold text-foreground">
                                {tc(p.placeName)}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {[p.province, p.country].filter(Boolean).map((s) => tc(s)).join(', ')}
                              </div>
                              {p.coordinates && (
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="font-mono text-[10px] text-muted-foreground">
                                    {p.coordinates.lat.toFixed(2)}°, {p.coordinates.lon.toFixed(2)}°
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setFocusedPlaceId(p.id)}
                                    className="inline-flex items-center gap-1 rounded-full bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 py-0.5 text-[10px] font-semibold text-[#0b4a68] cursor-pointer"
                                  >
                                    <MapPin className="size-2.5" /> {t.mapShowOnMap}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs font-medium text-foreground/85 max-w-[180px]">
                          {p.historicalName}
                        </TableCell>

                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline" className="font-mono text-[11px] mb-1">
                            {p.eraInTree}
                          </Badge>
                          <div className="text-[11px] text-muted-foreground">
                            {p.generationsPresent}
                          </div>
                        </TableCell>

                        <TableCell className="text-xs text-foreground/90 max-w-[260px] leading-relaxed">
                          {p.familyConnection}
                        </TableCell>

                        <TableCell className="max-w-[320px]">
                          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                            {p.extract}
                          </p>
                          <a
                            href={p.wikipediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0b4a68] hover:underline mt-1"
                          >
                            Read on Wikipedia <ExternalLink className="size-3" />
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: Family Tree Resources & Primary Archival Citations */}
        <TabsContent value="sources" className="space-y-5">
          {/* Curated External Research & Archive Resources for Jacob Lang & Maria Tampemawa */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-heritage text-2xl flex items-center gap-2">
                <BookOpen className="size-5 text-[#73a922]" />
                {t.familyResourcesTitle}
              </CardTitle>
              <CardDescription>{t.familyResourcesSubtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {FAMILY_TREE_RESOURCES.map((res) => (
                  <a
                    key={res.id}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col justify-between gap-2 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-white hover:border-[#0b4a68]/50 hover:shadow-sm p-3.5 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <Badge variant="outline" className="text-[10px] bg-white">
                          {res.category}
                        </Badge>
                        <span className="text-[11px] font-medium text-stone-500">
                          {res.provider}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm text-stone-900 group-hover:text-[#0b4a68] transition-colors">
                        {tc(res.title)}
                      </h4>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {tc(res.description)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-stone-200/70 text-[11px]">
                      <span className="text-stone-500 flex items-center gap-1 truncate">
                        <MapPin className="size-3 text-[#73a922] shrink-0" />
                        <span className="truncate">{tc(res.region)}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-[#0b4a68] shrink-0 ml-2">
                        {t.openExternalResource} <ExternalLink className="size-3" />
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="font-heritage text-2xl">
                    Primary Archival Citations (1723 – 1962)
                  </CardTitle>
                  <CardDescription>
                    Historical records transcribed from BrouwerTree, Nationaal Archief VOC rolls,
                    Delpher newspapers, KITLV Leiden, OpenArchives.nl, and Dutch Parliament.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={archiveSearch}
                    onChange={(e) => setArchiveSearch(e.target.value)}
                    placeholder="Filter citations..."
                    className="h-8 w-48 text-xs"
                  />
                  <Select value={archiveCategory} onValueChange={setArchiveCategory}>
                    <SelectTrigger className="h-8 w-[160px] text-xs">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Civil Registry">Civil Registry</SelectItem>
                      <SelectItem value="VOC Voyage">VOC Voyage</SelectItem>
                      <SelectItem value="Directory">Directory / Estate</SelectItem>
                      <SelectItem value="Passenger List">Passenger List</SelectItem>
                      <SelectItem value="Gravestone">Gravestone</SelectItem>
                      <SelectItem value="War Grave">War Grave</SelectItem>
                      <SelectItem value="Naturalization">Naturalization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year & Type</TableHead>
                    <TableHead>Archival Document</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Citation Source</TableHead>
                    <TableHead className="text-right">Tree Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArchives.map((a) => {
                    const linked = a.memberId
                      ? members.find((m) => m.id === a.memberId)
                      : undefined;
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="font-mono text-sm font-bold text-[#0b4a68]">
                            {a.year}
                          </div>
                          <Badge variant="gold" className="text-[10px] mt-1">
                            {a.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[340px]">
                          <div className="font-medium text-sm text-foreground">{a.title}</div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {a.summary}
                          </p>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{a.location}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[220px]">
                          <div>{a.sourceCitation}</div>
                          <div className="font-mono text-[10px] mt-0.5 opacity-80">
                            brouwertree.com/{a.pageRef}
                          </div>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {linked ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => onSelectMemberById(linked.id)}
                            >
                              <Sparkles className="size-3 text-amber-600" />
                              {linked.code}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
