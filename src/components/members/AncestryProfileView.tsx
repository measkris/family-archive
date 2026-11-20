'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  Compass,
  Dna,
  ExternalLink,
  FileCheck2,
  FileText,
  Heart,
  Image as ImageIcon,
  Leaf,
  Loader2,
  MapPin,
  Network,
  Pencil,
  Plus,
  Printer,
  Search,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import type { ArchivalSourceRecord, FamilyMemberRecord } from '@/lib/data/lang-genealogy';
import type { HeritageOriginRecord } from '@/lib/db/types';
import type { OpenArchiveRecord } from '@/app/api/heritage/openarchives/route';
import { buildPersonSearchConnectors } from '@/lib/genealogy/search-connectors';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Textarea } from '@/components/ui/input';
import { OptimizedPortrait } from '@/components/ui/OptimizedPortrait';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/auth/AuthContext';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { cn } from '@/lib/utils';

const AncestralLocationsMap = dynamic(
  () => import('@/components/heritage/AncestralLocationsMap').then((m) => m.AncestralLocationsMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[220px] w-full rounded-xl" />,
  }
);

interface AncestryProfileViewProps {
  member: FamilyMemberRecord;
  allMembers: FamilyMemberRecord[];
  archivalRecords: ArchivalSourceRecord[];
  heritageOrigins: HeritageOriginRecord[];
  canEdit?: boolean;
  onBackToTree: () => void;
  onSelectProfile: (member: FamilyMemberRecord) => void;
  onTraceInTree: (memberId: string) => void;
  onEditMember: (member: FamilyMemberRecord) => void;
  onAddChild: (parent: FamilyMemberRecord) => void;
  onDeleteMember: (member: FamilyMemberRecord) => Promise<void>;
  onPhotoUpdated: (member: FamilyMemberRecord) => void;
}

interface TimelineEvent {
  id: string;
  year: number | null;
  ageLabel: string;
  type: 'birth' | 'marriage' | 'child' | 'sibling' | 'career' | 'archive' | 'death';
  title: string;
  dateText: string;
  location?: string;
  description?: string;
  sourceCount?: number;
  linkedMember?: FamilyMemberRecord;
  isPrimaryHighlight?: boolean;
}

function parseYear(dateStr?: string, fallbackYear?: number): number | null {
  if (fallbackYear) return fallbackYear;
  if (!dateStr) return null;
  const m = dateStr.match(/\b(1[6-9]\d{2}|20\d{2})\b/);
  return m ? Number(m[1]) : null;
}

function computeAgeLabel(birthYear: number | null, eventYear: number | null, isBirth = false) {
  if (isBirth) return '(AGE)';
  if (birthYear === null || eventYear === null) return '—';
  const diff = eventYear - birthYear;
  if (diff < 0) return '';
  return String(diff);
}

function getRelationshipSubtitle(m: FamilyMemberRecord): string {
  if (m.id === 'I') return 'Founding Patriarch · Parenteel Lang–Tampemawa';
  if (m.generation === 2) {
    return `${m.gender === 'female' ? 'Daughter' : 'Son'} of Jacob Lang & Maria Tampemawa`;
  }
  if (m.generation === 3) {
    return `${m.gender === 'female' ? 'Granddaughter' : 'Grandson'} of Jacob Lang & Maria Tampemawa`;
  }
  if (m.generation === 4) {
    return `${m.gender === 'female' ? 'Great-granddaughter' : 'Great-grandson'} of Jacob Lang & Maria Tampemawa`;
  }
  return `Generation ${m.generation} Descendant`;
}

function AvatarThumb({
  photoUrl,
  name,
  gender,
  size = 'md',
}: {
  photoUrl?: string;
  name: string;
  gender?: 'male' | 'female' | 'unknown';
  size?: 'sm' | 'md';
}) {
  const cls = size === 'sm' ? 'size-8' : 'size-10';
  return (
    <div
      className={cn(
        cls,
        'rounded-full overflow-hidden border border-stone-300 shrink-0'
      )}
    >
      <OptimizedPortrait
        src={photoUrl}
        alt={name}
        gender={gender}
        width={size === 'sm' ? 96 : 120}
      />
    </div>
  );
}

export function AncestryProfileView({
  member,
  allMembers,
  archivalRecords,
  heritageOrigins,
  canEdit = true,
  onBackToTree,
  onSelectProfile,
  onTraceInTree,
  onEditMember,
  onAddChild,
  onDeleteMember,
  onPhotoUpdated,
}: AncestryProfileViewProps) {
  const { authFetch } = useAuth();
  const { t, tc } = useLanguage();
  const [subTab, setSubTab] = useState<'facts' | 'hints' | 'gallery' | 'lifestory' | 'heritage'>(
    'facts'
  );
  const [starred, setStarred] = useState(Boolean(member.isFeatured));
  const [showSiblings, setShowSiblings] = useState(true);
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'vital' | 'family'>('all');
  const [quickFindOpen, setQuickFindOpen] = useState(false);
  const [quickFind, setQuickFind] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live OpenArchives hints for this person/surname
  const [hints, setHints] = useState<OpenArchiveRecord[]>([]);
  const [hintsTotal, setHintsTotal] = useState<number>(0);
  const [hintsLoading, setHintsLoading] = useState<boolean>(false);

  // Pre-filled 1-click external archive search connectors (FamilySearch Solutions Gallery & regional archives)
  const searchConnectors = useMemo(() => buildPersonSearchConnectors(member), [member]);

  // Tab-specific editing states
  const [editingLifeStory, setEditingLifeStory] = useState(false);
  const [bioDraft, setBioDraft] = useState(member.bio || '');
  const [occupationDraft, setOccupationDraft] = useState(member.occupation || '');
  const [savingLifeStory, setSavingLifeStory] = useState(false);

  const [editingHeritage, setEditingHeritage] = useState(false);
  const [tagsDraft, setTagsDraft] = useState(member.heritageTags.join(', '));
  const [regionDraft, setRegionDraft] = useState(member.region || '');
  const [savingHeritage, setSavingHeritage] = useState(false);

  const [addingSourceOpen, setAddingSourceOpen] = useState(false);
  const [newSourceCitation, setNewSourceCitation] = useState('');
  const [savingSource, setSavingSource] = useState(false);

  const [prevMemberId, setPrevMemberId] = useState(member.id);
  if (prevMemberId !== member.id) {
    setPrevMemberId(member.id);
    setBioDraft(member.bio || '');
    setOccupationDraft(member.occupation || '');
    setTagsDraft(member.heritageTags.join(', '));
    setRegionDraft(member.region || '');
    setEditingLifeStory(false);
    setEditingHeritage(false);
    setAddingSourceOpen(false);
  }

  function startEditingLifeStory() {
    setBioDraft(member.bio || '');
    setOccupationDraft(member.occupation || '');
    setEditingLifeStory(true);
  }

  function startEditingHeritage() {
    setTagsDraft(member.heritageTags.join(', '));
    setRegionDraft(member.region || '');
    setEditingHeritage(true);
  }

  async function handleSaveLifeStory() {
    if (!canEdit) return;
    setSavingLifeStory(true);
    try {
      const res = await authFetch(`/api/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: bioDraft.trim(),
          occupation: occupationDraft.trim(),
        }),
      });
      const json = await res.json();
      if (json.member) {
        onPhotoUpdated(json.member);
        setEditingLifeStory(false);
      }
    } catch (err) {
      console.error('Failed to save LifeStory:', err);
    } finally {
      setSavingLifeStory(false);
    }
  }

  async function handleSaveHeritage() {
    if (!canEdit) return;
    setSavingHeritage(true);
    try {
      const splitTags = tagsDraft
        .split(/[,;|]/)
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await authFetch(`/api/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heritageTags: splitTags,
          region: regionDraft.trim() || member.region,
        }),
      });
      const json = await res.json();
      if (json.member) {
        onPhotoUpdated(json.member);
        setEditingHeritage(false);
      }
    } catch (err) {
      console.error('Failed to save heritage:', err);
    } finally {
      setSavingHeritage(false);
    }
  }

  async function handleAddSource() {
    if (!canEdit || !newSourceCitation.trim()) return;
    setSavingSource(true);
    try {
      const updatedSources = [...(member.sources || []), newSourceCitation.trim()];
      const res = await authFetch(`/api/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources: updatedSources }),
      });
      const json = await res.json();
      if (json.member) {
        onPhotoUpdated(json.member);
        setNewSourceCitation('');
        setAddingSourceOpen(false);
      }
    } catch (err) {
      console.error('Failed to add source:', err);
    } finally {
      setSavingSource(false);
    }
  }

  async function handleDeleteSource(index: number) {
    if (!canEdit) return;
    const updatedSources = member.sources.filter((_, i) => i !== index);
    try {
      const res = await authFetch(`/api/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources: updatedSources }),
      });
      const json = await res.json();
      if (json.member) {
        onPhotoUpdated(json.member);
      }
    } catch (err) {
      console.error('Failed to delete source:', err);
    }
  }

  const parent = member.parentId
    ? allMembers.find((m) => m.id === member.parentId) || null
    : null;
  const siblings = useMemo(
    () =>
      member.parentId
        ? allMembers.filter((m) => m.parentId === member.parentId && m.id !== member.id)
        : [],
    [allMembers, member.parentId, member.id]
  );
  const children = useMemo(
    () => allMembers.filter((m) => m.parentId === member.id),
    [allMembers, member.id]
  );

  // Ancestor trail back to Jacob Lang (I)
  const ancestorTrail = useMemo(() => {
    const trail: FamilyMemberRecord[] = [];
    const byId = new Map(allMembers.map((m) => [m.id, m]));
    let curr: FamilyMemberRecord | undefined = member;
    while (curr) {
      trail.unshift(curr);
      curr = curr.parentId ? byId.get(curr.parentId) : undefined;
    }
    return trail;
  }, [allMembers, member]);

  // Related BrouwerTree archival records
  const memberArchives = useMemo(() => {
    const surnameLower = member.lastName.toLowerCase();
    return archivalRecords.filter(
      (a) =>
        a.memberId === member.id ||
        a.personNames.some((p) => p.toLowerCase().includes(member.fullName.toLowerCase())) ||
        (member.id === 'I' && a.personNames.some((p) => p.toLowerCase().includes(surnameLower)))
    );
  }, [archivalRecords, member]);

  // Fetch live OpenArchives.nl hints for this member
  useEffect(() => {
    let cancelled = false;
    async function loadHints() {
      setHintsLoading(true);
      try {
        // First try full name, fallback to surname if 0 matches
        const qFull = `${member.firstName} ${member.lastName}`;
        let res = await fetch(
          `/api/heritage/openarchives?q=${encodeURIComponent(qFull)}&limit=12`
        );
        let json = await res.json();
        if (!cancelled && (!json.records || json.records.length === 0)) {
          res = await fetch(
            `/api/heritage/openarchives?q=${encodeURIComponent(member.lastName)}&limit=12`
          );
          json = await res.json();
        }
        if (!cancelled) {
          setHints(Array.isArray(json.records) ? json.records : []);
          setHintsTotal(Number(json.totalFound || 0));
        }
      } catch {
        if (!cancelled) {
          setHints([]);
          setHintsTotal(0);
        }
      } finally {
        if (!cancelled) setHintsLoading(false);
      }
    }
    loadHints();
    return () => {
      cancelled = true;
    };
  }, [member.id, member.firstName, member.lastName]);

  // Build authentic Ancestry.com chronological Timeline with Year + Age gutter!
  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    const bYear = parseYear(member.birthDate, member.birthYear);
    const dYear = parseYear(member.deathDate, member.deathYear);
    const events: TimelineEvent[] = [];

    // 1. Birth
    events.push({
      id: 'ev-birth',
      year: bYear,
      ageLabel: computeAgeLabel(bYear, bYear, true),
      type: 'birth',
      title: 'Birth',
      dateText: member.birthDate || (bYear ? String(bYear) : 'Date unrecorded'),
      location: member.birthPlace || member.region,
      description:
        member.fatherName || member.motherName
          ? `Born to ${[member.fatherName, member.motherName].filter(Boolean).join(' and ')}.`
          : undefined,
      sourceCount: Math.max(1, member.sources.length),
      isPrimaryHighlight: true,
    });

    // 2. Sibling births & deaths during lifetime
    for (const sib of siblings) {
      const sibB = parseYear(sib.birthDate, sib.birthYear);
      const sibD = parseYear(sib.deathDate, sib.deathYear);
      if (sibB && (!bYear || sibB >= bYear) && (!dYear || sibB <= dYear)) {
        events.push({
          id: `ev-sib-b-${sib.id}`,
          year: sibB,
          ageLabel: computeAgeLabel(bYear, sibB),
          type: 'sibling',
          title: `Birth of ${sib.gender === 'female' ? 'sister' : 'brother'} ${sib.fullName}`,
          dateText: sib.birthDate || String(sibB),
          location: sib.birthPlace || sib.region,
          linkedMember: sib,
        });
      }
      if (sibD && (!bYear || sibD >= bYear) && (!dYear || sibD <= dYear)) {
        events.push({
          id: `ev-sib-d-${sib.id}`,
          year: sibD,
          ageLabel: computeAgeLabel(bYear, sibD),
          type: 'sibling',
          title: `Death of ${sib.gender === 'female' ? 'sister' : 'brother'} ${sib.fullName}`,
          dateText: sib.deathDate || String(sibD),
          location: sib.deathPlace || sib.region,
          linkedMember: sib,
        });
      }
    }

    // 3. Marriages
    member.spouses.forEach((sp, idx) => {
      const mYear = parseYear(sp.marriageDate);
      events.push({
        id: `ev-mar-${sp.id}`,
        year: mYear,
        ageLabel: computeAgeLabel(bYear, mYear),
        type: 'marriage',
        title: `Marriage to ${sp.name}`,
        dateText: sp.marriageDate || 'Date unrecorded',
        location: sp.marriagePlace || member.region,
        description:
          [sp.heritage, sp.occupation, sp.notes].filter(Boolean).join(' · ') ||
          `Marriage #${idx + 1}`,
        isPrimaryHighlight: true,
      });
    });

    // 4. Occupation / Residence milestone
    if (member.occupation) {
      const occYearMatch = member.occupation.match(/\b(1[89]\d{2})\b/);
      const occYear = occYearMatch ? Number(occYearMatch[1]) : bYear ? bYear + 28 : null;
      events.push({
        id: 'ev-occ',
        year: occYear,
        ageLabel: computeAgeLabel(bYear, occYear),
        type: 'career',
        title: 'Occupation & Residence',
        dateText: occYear ? String(occYear) : 'Adult life',
        location: member.region,
        description: member.occupation,
        sourceCount: 1,
        isPrimaryHighlight: true,
      });
    }

    // 5. Birth of Children
    for (const child of children) {
      const cYear = parseYear(child.birthDate, child.birthYear);
      events.push({
        id: `ev-child-${child.id}`,
        year: cYear,
        ageLabel: computeAgeLabel(bYear, cYear),
        type: 'child',
        title: `Birth of ${child.gender === 'female' ? 'daughter' : 'son'} ${child.fullName}`,
        dateText: child.birthDate || (cYear ? String(cYear) : 'Date unrecorded'),
        location: child.birthPlace || child.region,
        linkedMember: child,
      });
    }

    // 6. Archival Document Milestones
    for (const arc of memberArchives) {
      if (arc.memberId === member.id) {
        events.push({
          id: `ev-arc-${arc.id}`,
          year: arc.year,
          ageLabel: computeAgeLabel(bYear, arc.year),
          type: 'archive',
          title: arc.title,
          dateText: arc.dateLabel,
          location: arc.location,
          description: arc.summary,
          sourceCount: 1,
        });
      }
    }

    // 7. Death
    if (member.deathDate || member.deathYear) {
      events.push({
        id: 'ev-death',
        year: dYear,
        ageLabel: computeAgeLabel(bYear, dYear),
        type: 'death',
        title: 'Death',
        dateText: member.deathDate || String(dYear),
        location: member.deathPlace || member.region,
        description: member.burialPlace ? `Buried at ${member.burialPlace}.` : undefined,
        sourceCount: 1,
        isPrimaryHighlight: true,
      });
    }

    return events.sort((a, b) => {
      if (a.type === 'birth') return -1;
      if (b.type === 'birth') return 1;
      if (a.type === 'death') return 1;
      if (b.type === 'death') return -1;
      return (a.year ?? 9999) - (b.year ?? 9999);
    });
  }, [member, siblings, children, memberArchives]);

  const visibleTimeline = useMemo(() => {
    if (timelineFilter === 'vital') {
      return timelineEvents.filter((e) =>
        ['birth', 'marriage', 'career', 'death'].includes(e.type)
      );
    }
    if (timelineFilter === 'family') {
      return timelineEvents.filter((e) => ['marriage', 'child', 'sibling'].includes(e.type));
    }
    return timelineEvents;
  }, [timelineEvents, timelineFilter]);

  // Matched heritage origin profiles for this member + spouses
  const matchedHeritageProfiles = useMemo(() => {
    const names = new Set([
      member.lastName.toLowerCase(),
      ...member.spouses.map((s) => s.surname.toLowerCase()),
    ]);
    return heritageOrigins.filter((h) => names.has(h.surname.toLowerCase()));
  }, [heritageOrigins, member]);

  const quickFindMatches = useMemo(() => {
    const q = quickFind.trim().toLowerCase();
    if (!q) return [];
    return allMembers
      .filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.code.toLowerCase().includes(q) ||
          m.spouses.some((s) => s.name.toLowerCase().includes(q))
      )
      .slice(0, 7);
  }, [quickFind, allMembers]);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const up = await authFetch('/api/upload', { method: 'POST', body: fd });
      const uj = await up.json();
      if (!up.ok || !uj.url) throw new Error(uj.error || 'Upload failed');
      const patch = await authFetch(`/api/members/${encodeURIComponent(member.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: uj.url }),
      });
      const pj = await patch.json();
      if (patch.ok && pj.member) {
        onPhotoUpdated(pj.member);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Photo upload failed');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete() {
    if (member.id === 'I') return;
    if (!window.confirm(`Remove ${member.fullName} from the family tree?`)) return;
    setDeleting(true);
    try {
      await onDeleteMember(member);
      onBackToTree();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-xl border border-stone-300 bg-[#f6f5f2] overflow-hidden shadow-lg animate-slide-up">
      {/* ========== ANCESTRY CHARCOAL PROFILE HERO (Screenshot 2 Top Half) ========== */}
      <div className="bg-[#484a4c] text-white">
        {/* Top Utility Navigation Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-2.5 border-b border-white/10 bg-[#3d3f41]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToTree}
              className="inline-flex items-center gap-1.5 rounded-md bg-white/12 hover:bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-3.5" /> Family Tree
            </button>

            {/* Quick "Find in tree" switcher */}
            <div className="relative">
              {quickFindOpen ? (
                <div className="relative w-56">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-stone-300" />
                  <Input
                    autoFocus
                    value={quickFind}
                    onChange={(e) => setQuickFind(e.target.value)}
                    placeholder="Switch person..."
                    className="h-7 pl-8 pr-7 text-xs bg-[#2c2e30] border-white/20 text-white placeholder:text-stone-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setQuickFindOpen(false);
                      setQuickFind('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                  {quickFindMatches.length > 0 && (
                    <div className="absolute left-0 top-8 z-50 w-72 rounded-lg border border-stone-300 bg-white text-stone-900 shadow-2xl p-1">
                      {quickFindMatches.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            onSelectProfile(m);
                            setQuickFindOpen(false);
                            setQuickFind('');
                          }}
                          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-stone-100 cursor-pointer"
                        >
                          <AvatarThumb
                            photoUrl={m.photoUrl}
                            name={m.fullName}
                            gender={m.gender}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{m.fullName}</div>
                            <div className="text-[10px] text-stone-500">
                              {m.code} · {m.birthYear || '?'}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setQuickFindOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-medium text-stone-100 transition-colors cursor-pointer"
                >
                  <Search className="size-3.5" /> Find in tree
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSubTab('hints')}
              className="inline-flex items-center gap-1.5 rounded-md bg-white/10 hover:bg-white/20 px-2.5 py-1.5 text-xs font-medium text-stone-100 cursor-pointer"
            >
              <Search className="size-3.5" /> Search Archives
            </button>
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={() => onAddChild(member)}
                  className="inline-flex items-center gap-1 rounded-md bg-white/10 hover:bg-white/20 px-2.5 py-1.5 text-xs font-medium text-stone-100 cursor-pointer"
                >
                  <Plus className="size-3.5" /> Add Child
                </button>
                <button
                  type="button"
                  onClick={() => onEditMember(member)}
                  className="inline-flex items-center gap-1 rounded-md bg-white/15 hover:bg-white/25 px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
                >
                  <Pencil className="size-3.5" /> Edit
                </button>
                {member.id !== 'I' && (
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={handleDelete}
                    title="Delete record"
                    className="inline-flex items-center justify-center rounded-md bg-rose-600/30 hover:bg-rose-600/50 p-1.5 text-rose-100 cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Center Hero Identity Block */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Square Framed Portrait with Camera Upload */}
            <div className="relative shrink-0">
              <div className="size-28 sm:size-32 rounded-md overflow-hidden border-2 border-white/80 shadow-xl bg-stone-200">
                <OptimizedPortrait
                  src={member.photoUrl}
                  alt={member.fullName}
                  gender={member.gender}
                  width={320}
                  priority
                />
              </div>
              {canEdit && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    title="Upload or change portrait photo"
                    className="absolute -bottom-2 -right-2 flex size-8 items-center justify-center rounded-full bg-[#2e3032] border-2 border-white text-white shadow-md hover:bg-black cursor-pointer"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Camera className="size-4" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </>
              )}
            </div>

            {/* Vital Identity Details */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="font-heritage text-3xl sm:text-4xl font-bold tracking-tight text-white">
                  {member.fullName}
                </h1>
                <button
                  type="button"
                  onClick={() => setStarred((s) => !s)}
                  title="Star favorite ancestor"
                  className="rounded-md p-1 hover:bg-white/15 transition-colors cursor-pointer"
                >
                  <Star
                    className={cn(
                      'size-5',
                      starred ? 'text-amber-300 fill-amber-300' : 'text-stone-300'
                    )}
                  />
                </button>
              </div>

              <div className="mt-1.5 space-y-0.5 text-xs sm:text-sm">
                <div className="text-stone-100">
                  <span className="font-bold tracking-wide text-stone-300 mr-1.5">
                    {t.bornLabel.toUpperCase()}
                  </span>
                  <span className="font-semibold">
                    {member.birthDate || (member.birthYear ? String(member.birthYear) : 'Unknown')}
                  </span>
                  {member.birthPlace && (
                    <span className="text-stone-300"> • {tc(member.birthPlace)}</span>
                  )}
                </div>

                {(member.deathDate || member.deathYear) && (
                  <div className="text-stone-100">
                    <span className="font-bold tracking-wide text-stone-300 mr-1.5">
                      {t.diedLabel.toUpperCase()}
                    </span>
                    <span className="font-semibold">
                      {member.deathDate || String(member.deathYear)}
                    </span>
                    {member.deathPlace && (
                      <span className="text-stone-300"> • {tc(member.deathPlace)}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-stone-300">
                <span>{getRelationshipSubtitle(member)}</span>
                <span>·</span>
                <span className="font-mono text-amber-200">{member.code}</span>
                <span className="inline-flex items-center gap-1 rounded bg-[#73a922] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  <Leaf className="size-3 fill-white" /> {hintsTotal > 0 ? hintsTotal.toLocaleString() : member.sources.length}
                </span>
              </div>

              {/* Ancestry White Tag Pills */}
              <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#2e3032]">
                  Direct Ancestor
                </span>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#2e3032]">
                  Gen {member.generation} · {member.branch}
                </span>
                {member.heritageTags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-semibold text-[#2e3032]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Ancestry Action Link Strip */}
          <div className="mt-5 pt-3 border-t border-white/15 flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-2 text-xs text-stone-200">
            <button
              type="button"
              onClick={() => setSubTab('lifestory')}
              className="inline-flex items-center gap-1.5 hover:text-white cursor-pointer"
            >
              <FileText className="size-3.5" /> Notes &amp; LifeStory
            </button>
            <button
              type="button"
              onClick={() => onTraceInTree(member.id)}
              className="inline-flex items-center gap-1.5 hover:text-white cursor-pointer"
            >
              <Network className="size-3.5" /> Trace in Tree
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 hover:text-white cursor-pointer"
            >
              <Printer className="size-3.5" /> Print
            </button>
            <a
              href={member.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-white"
            >
              <ExternalLink className="size-3.5" /> BrouwerTree Reference
            </a>
          </div>
        </div>
      </div>

      {/* ========== ANCESTRY SUB-TAB BAR (White bar + Green underline) ========== */}
      <div className="border-b border-stone-300 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'facts', label: t.factsTab },
              {
                id: 'hints',
                label: t.hintsTab,
                count: hintsTotal > 0 ? hintsTotal : member.sources.length,
              },
              { id: 'gallery', label: t.galleryTab },
              { id: 'lifestory', label: t.lifeStoryTab },
              { id: 'heritage', label: t.heritageTab },
            ].map((tab) => {
              const active = subTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSubTab(tab.id as typeof subTab)}
                  className={cn(
                    'relative py-3.5 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 border-b-[3px]',
                    active
                      ? 'border-[#73a922] text-[#222426]'
                      : 'border-transparent text-stone-500 hover:text-stone-900'
                  )}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="rounded bg-[#73a922] px-1.5 py-0.2 text-[11px] font-bold text-white">
                      {tab.count > 999 ? '999+' : tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {canEdit && (
            <div className="flex items-center gap-2 py-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (subTab === 'lifestory') startEditingLifeStory();
                  else if (subTab === 'heritage') startEditingHeritage();
                  else if (subTab === 'hints') setAddingSourceOpen(true);
                  else if (subTab === 'gallery') fileInputRef.current?.click();
                  else onEditMember(member);
                }}
                className="h-8 gap-1.5 text-xs font-semibold border-stone-300 hover:border-[#73a922] hover:bg-[#f6faef] text-[#222426] cursor-pointer shadow-2xs"
              >
                <Pencil className="size-3.5 text-[#73a922]" />
                <span className="hidden sm:inline">
                  {subTab === 'lifestory'
                    ? t.editLifeStoryAction
                    : subTab === 'heritage'
                    ? t.editHeritageAction
                    : subTab === 'hints'
                    ? t.addSourceAction
                    : subTab === 'gallery'
                    ? t.uploadPhoto
                    : t.editFactsAction}
                </span>
                <span className="sm:hidden">{t.editTabAction}</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ========== MAIN PROFILE CONTENT ========== */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        {/* TAB 1: ICONIC ANCESTRY 3-COLUMN FACTS LAYOUT (Screenshot 2!) */}
        {subTab === 'facts' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLUMN 1: TIMELINE WITH YEAR + AGE GUTTER (lg:col-span-5) */}
            <section className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#222426]">Timeline</h2>
                <div className="flex items-center gap-1.5">
                  <select
                    value={timelineFilter}
                    onChange={(e) =>
                      setTimelineFilter(e.target.value as 'all' | 'vital' | 'family')
                    }
                    className="h-7 rounded-full border border-stone-300 bg-white px-2.5 text-xs font-medium text-stone-700 cursor-pointer"
                  >
                    <option value="all">Filter: All</option>
                    <option value="vital">Vital Only</option>
                    <option value="family">Family Events</option>
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-full text-xs px-3 bg-white"
                    onClick={() => onEditMember(member)}
                  >
                    <Plus className="size-3" /> Edit
                  </Button>
                </div>
              </div>

              <div className="space-y-2.5">
                {visibleTimeline.map((ev) => (
                  <div key={ev.id} className="flex items-stretch gap-3">
                    {/* Year + Age Left Gutter (exact Ancestry signature!) */}
                    <div className="w-12 shrink-0 pt-2 text-right leading-tight">
                      <div className="font-mono text-xs font-bold text-stone-700">
                        {ev.year ?? '—'}
                      </div>
                      <div className="font-mono text-[10px] text-stone-500 uppercase">
                        {ev.ageLabel}
                      </div>
                    </div>

                    {/* Event Card */}
                    <div
                      className={cn(
                        'flex-1 rounded-lg border p-3 transition-shadow',
                        ev.isPrimaryHighlight
                          ? 'bg-white border-stone-300 shadow-xs'
                          : 'bg-[#efeee9] border-stone-200/90'
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        {ev.isPrimaryHighlight && (
                          <div className="size-10 rounded border border-stone-200 bg-stone-100 flex items-center justify-center shrink-0 text-stone-500">
                            {ev.type === 'marriage' ? (
                              <Heart className="size-4 text-rose-600" />
                            ) : ev.type === 'career' ? (
                              <Briefcase className="size-4 text-[#0b4a68]" />
                            ) : (
                              <FileText className="size-4 text-stone-600" />
                            )}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-[#222426] leading-snug">
                            {ev.linkedMember ? (
                              <button
                                type="button"
                                onClick={() => onSelectProfile(ev.linkedMember!)}
                                className="text-left hover:text-[#0b4a68] hover:underline cursor-pointer"
                              >
                                {ev.title}
                              </button>
                            ) : (
                              ev.title
                            )}
                          </div>

                          <div className="text-xs text-stone-600 mt-0.5">
                            {ev.dateText}
                            {ev.location ? ` • ${ev.location}` : ''}
                          </div>

                          {ev.description && (
                            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                              {ev.description}
                            </p>
                          )}

                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className="text-stone-500">
                              {ev.sourceCount ? `${ev.sourceCount} archival source` : ''}
                            </span>
                            {ev.linkedMember ? (
                              <button
                                type="button"
                                onClick={() => onSelectProfile(ev.linkedMember!)}
                                className="inline-flex items-center gap-1 font-semibold text-[#0b6a8a] hover:underline cursor-pointer"
                              >
                                <Compass className="size-3" /> Explore
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSubTab('hints')}
                                className="inline-flex items-center gap-1 font-semibold text-[#0b6a8a] hover:underline cursor-pointer"
                              >
                                <Compass className="size-3" /> Explore
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* COLUMN 2: SOURCES STACK (lg:col-span-3) */}
            <section className="lg:col-span-3 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#222426]">Sources</h2>
                <button
                  type="button"
                  onClick={() => setSubTab('hints')}
                  className="h-7 rounded-full border border-stone-300 bg-white px-2.5 text-xs font-medium text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Live API
                </button>
              </div>

              <div className="text-xs font-semibold text-stone-500">
                Archival &amp; Almanak Sources ({member.sources.length + memberArchives.length})
              </div>

              <div className="space-y-2">
                {member.sources.map((src, i) => (
                  <div
                    key={`src-${i}`}
                    className="flex items-start gap-2.5 rounded-lg border border-stone-300 bg-white p-2.5 shadow-2xs"
                  >
                    <div className="size-10 rounded border border-stone-200 bg-[#f4f1ea] flex items-center justify-center shrink-0 text-amber-800">
                      <BookOpen className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-[#222426] leading-snug">
                        {src}
                      </div>
                      <div className="text-[10px] text-stone-500 mt-1">
                        BrouwerTree Citation
                      </div>
                    </div>
                  </div>
                ))}

                {memberArchives.map((arc) => (
                  <div
                    key={arc.id}
                    className="flex items-start gap-2.5 rounded-lg border border-stone-300 bg-white p-2.5 shadow-2xs"
                  >
                    <div className="size-10 rounded border border-stone-200 bg-sky-50 flex items-center justify-center shrink-0 text-[#0b4a68]">
                      <FileText className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-[#222426] leading-snug">
                        {arc.title}
                      </div>
                      <div className="text-[10px] text-stone-500 mt-0.5">
                        {arc.dateLabel} · {arc.category}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Live OpenArchives.nl Hint Card */}
                <button
                  type="button"
                  onClick={() => setSubTab('hints')}
                  className="flex w-full items-center gap-2.5 rounded-lg border border-[#73a922]/40 bg-[#f5faed] hover:bg-[#ebf5dc] p-3 text-left transition-colors cursor-pointer"
                >
                  <div className="size-10 rounded-full bg-[#73a922] text-white flex items-center justify-center shrink-0">
                    <Leaf className="size-5 fill-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-[#365314]">
                      {hintsLoading
                        ? 'Checking OpenArchives.nl...'
                        : `${hintsTotal.toLocaleString()} Live Archive Matches`}
                    </div>
                    <div className="text-[11px] text-[#4d7c0f]">
                      Click to inspect Dutch &amp; N.O.I. certificates
                    </div>
                  </div>
                </button>
              </div>
            </section>

            {/* COLUMN 3: FAMILY TREE PANEL — PARENTS, SIBLINGS, SPOUSE & CHILDREN (lg:col-span-4) */}
            <section className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#222426]">Family</h2>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-full text-xs px-3 bg-white"
                  onClick={() => onAddChild(member)}
                >
                  <Plus className="size-3" /> Add Child
                </Button>
              </div>

              {/* Parents */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-stone-600">Parents</h3>
                {parent ? (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => onSelectProfile(parent)}
                      className="flex w-full items-center gap-3 rounded-lg border border-stone-300 bg-white hover:border-[#73a922] p-2.5 text-left transition-colors cursor-pointer"
                    >
                      <AvatarThumb
                        photoUrl={parent.photoUrl}
                        name={parent.fullName}
                        gender={parent.gender}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#222426] truncate">
                          {parent.fullName}
                        </div>
                        <div className="text-xs text-stone-500 font-mono">
                          {parent.birthYear || '?'}–{parent.deathYear || ''}
                        </div>
                      </div>
                    </button>

                    {parent.spouses[0] && (
                      <button
                        type="button"
                        onClick={() => onSelectProfile(parent)}
                        className="flex w-full items-center gap-3 rounded-lg border border-stone-300 bg-white hover:border-[#73a922] p-2.5 text-left transition-colors cursor-pointer"
                      >
                        <AvatarThumb
                          photoUrl={parent.spouses[0].photoUrl}
                          name={member.motherName || parent.spouses[0].name}
                          gender={parent.gender === 'male' ? 'female' : 'male'}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-[#222426] truncate">
                            {member.motherName || parent.spouses[0].name}
                          </div>
                          <div className="text-xs text-stone-500">
                            {parent.spouses[0].birthDate || 'Spouse of ' + parent.firstName}
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-stone-300 bg-white/70 p-3 text-xs text-stone-500">
                    Founding ancestor of the documented BrouwerTree Lang–Tampemawa Parenteel.
                  </div>
                )}
              </div>

              {/* Collapsible Siblings (exact Ancestry "Siblings ⌄" pattern!) */}
              {siblings.length > 0 && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowSiblings((v) => !v)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0b6a8a] hover:underline cursor-pointer"
                  >
                    Siblings ({siblings.length})
                    {showSiblings ? (
                      <ChevronDown className="size-3.5" />
                    ) : (
                      <ChevronRight className="size-3.5" />
                    )}
                  </button>

                  {showSiblings && (
                    <div className="space-y-1.5">
                      {siblings.map((sib) => (
                        <button
                          key={sib.id}
                          type="button"
                          onClick={() => onSelectProfile(sib)}
                          className="flex w-full items-center gap-2.5 rounded-lg border border-stone-200 bg-white hover:border-[#73a922] p-2 text-left transition-colors cursor-pointer"
                        >
                          <AvatarThumb
                            photoUrl={sib.photoUrl}
                            name={sib.fullName}
                            gender={sib.gender}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-[#222426] truncate">
                              {sib.fullName}
                            </div>
                            <div className="text-[11px] text-stone-500 font-mono">
                              {sib.birthYear || '?'}–{sib.deathYear || ''}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Spouse and Children with Ancestry vertical tree connector */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-stone-600">Spouse and children</h3>

                {member.spouses.length > 0 ? (
                  <div className="space-y-2">
                    {member.spouses.map((sp) => (
                      <div
                        key={sp.id}
                        className="flex items-center gap-3 rounded-lg border border-stone-300 bg-white p-2.5"
                      >
                        <AvatarThumb
                          photoUrl={sp.photoUrl}
                          name={sp.name}
                          gender={member.gender === 'male' ? 'female' : 'male'}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-[#222426] truncate">
                            {sp.name}
                          </div>
                          <div className="text-xs text-stone-500">
                            {sp.birthDate || sp.marriageDate
                              ? [
                                  sp.birthDate ? `b. ${sp.birthDate}` : null,
                                  sp.deathDate ? `d. ${sp.deathDate}` : null,
                                ]
                                  .filter(Boolean)
                                  .join(' · ') || `m. ${sp.marriageDate}`
                              : sp.heritage || 'Recorded spouse'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-stone-300 bg-white/70 p-2.5 text-xs text-stone-500">
                    No spouse recorded.
                  </div>
                )}

                {children.length > 0 && (
                  <div className="ml-5 pl-4 border-l-2 border-stone-300 space-y-2 pt-1">
                    {children.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => onSelectProfile(child)}
                        className="relative flex w-full items-center gap-3 rounded-lg border border-stone-300 bg-white hover:border-[#73a922] hover:bg-[#f9fcf5] p-2.5 text-left transition-colors cursor-pointer"
                      >
                        <span className="absolute -left-4 top-1/2 h-[2px] w-4 bg-stone-300" />
                        <AvatarThumb
                          photoUrl={child.photoUrl}
                          name={child.fullName}
                          gender={child.gender}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-[#222426] truncate">
                            {child.fullName}
                          </div>
                          <div className="text-xs text-stone-500 font-mono">
                            {child.birthYear || '?'}–{child.deathYear || ''}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Compact Interactive Location Map Pin in Facts View */}
        {subTab === 'facts' && (member.birthPlace || member.region) && (
          <div className="mt-5 rounded-xl border border-stone-300 bg-white p-4 space-y-2.5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#222426] flex items-center gap-1.5">
                <MapPin className="size-4 text-[#73a922]" />
                {t.ancestralMapLocation}
              </h3>
              <span className="text-xs font-medium text-[#0b4a68]">
                {tc(member.birthPlace || member.region)}
              </span>
            </div>
            <AncestralLocationsMap
              members={allMembers}
              singleLocationText={member.birthPlace || member.region}
              secondaryLocationText={member.deathPlace}
              personName={member.fullName}
              heightClass="h-[220px]"
            />
          </div>
        )}

        {/* TAB 2: LIVE OPENARCHIVES.NL HINTS */}
        {subTab === 'hints' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-[#73a922]/30 bg-[#f6faef] p-4">
              <div>
                <h2 className="text-lg font-bold text-[#222426] flex items-center gap-2">
                  <Leaf className="size-5 text-[#73a922] fill-[#73a922]" />
                  Live Historical Record Hints for {member.fullName}
                </h2>
                <p className="text-xs text-stone-600 mt-0.5">
                  Queried live from OpenArchives.nl (Dutch &amp; Dutch East Indies civil registries,
                  passenger registers, and regional archives).
                </p>
              </div>
              <Badge variant="emerald" className="font-mono text-xs">
                {hintsTotal.toLocaleString()} total matches
              </Badge>
            </div>

            {hintsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-stone-300 bg-white p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-24 rounded-full" />
                      <Skeleton className="h-3.5 w-16" />
                    </div>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-5/6" />
                    <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-3.5 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : hints.length === 0 ? (
              <div className="rounded-lg border border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
                No direct matches returned for &ldquo;{member.fullName}&rdquo; in Dutch European
                registries (regional Minahasa / N.O.I. records are listed in the Facts → Sources
                column).
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {hints.map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-lg border border-stone-300 bg-white p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="gold">{rec.eventType}</Badge>
                        <span className="font-mono text-xs text-stone-500">{rec.eventDate}</span>
                      </div>
                      <h3 className="font-bold text-sm text-[#222426] mt-2">{rec.personName}</h3>
                      <p className="text-xs text-stone-600 mt-1 flex items-center gap-1">
                        <MapPin className="size-3 shrink-0" /> {rec.eventPlace}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-1">
                        {rec.archiveName} ({rec.sourceType}) · Role: {rec.relationType}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                      <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                        {rec.hasScan && <FileCheck2 className="size-3.5" />}
                        {rec.hasScan ? 'Original scan available' : 'Transcribed record'}
                      </span>
                      <a
                        href={rec.recordUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0b6a8a] hover:underline"
                      >
                        Review Record <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* FamilySearch Solutions Gallery & Free Archive Search Connectors */}
            <div className="rounded-lg border border-[#0b4a68]/20 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-[#222426] flex items-center gap-2">
                    <BookOpen className="size-4 text-[#0b4a68]" />
                    1-Click Archive Search — {member.fullName}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Pre-filled search links to FamilySearch Solutions Gallery, Delpher, OpenArchives.nl, BillionGraves &amp; more — all free.
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px] font-mono border-[#0b4a68]/30 text-[#0b4a68]">
                  {searchConnectors.length} sources
                </Badge>
              </div>

              {(['FamilySearch & Solutions', 'Dutch East Indies & Indo', 'European Archives', 'Cemetery & Memorials'] as const).map((cat) => {
                const catItems = searchConnectors.filter((c) => c.category === cat);
                if (!catItems.length) return null;
                return (
                  <div key={cat}>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5 pl-0.5">{cat}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {catItems.map((conn) => (
                        <a
                          key={conn.id}
                          href={conn.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex flex-col gap-1 rounded-lg border border-stone-200 bg-stone-50/60 hover:border-[#0b4a68]/40 hover:bg-sky-50/60 hover:shadow-sm p-2.5 transition-all"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-semibold text-xs text-stone-800 group-hover:text-[#0b4a68] transition-colors line-clamp-1">
                              {conn.name}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono bg-white border-stone-200">
                                FREE
                              </Badge>
                              <ExternalLink className="size-3 text-stone-400 group-hover:text-[#0b4a68]" />
                            </div>
                          </div>
                          <p className="text-[11px] text-stone-500 leading-relaxed line-clamp-2">{conn.description}</p>
                          {conn.partnerInfo && (
                            <span className="text-[10px] font-medium text-emerald-700">{conn.partnerInfo}</span>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sources & Citations — editable list */}
            {((member.sources && member.sources.length > 0) || canEdit) && (
              <div className="rounded-lg border border-stone-300 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-sm text-[#222426] flex items-center gap-2">
                    <FileText className="size-4 text-[#73a922]" />
                    Sources &amp; Citations
                  </h3>
                  {canEdit && !addingSourceOpen && (
                    <Button size="sm" variant="outline" onClick={() => setAddingSourceOpen(true)}>
                      <Plus className="size-3.5" /> {t.addSourceAction}
                    </Button>
                  )}
                </div>

                {member.sources && member.sources.length > 0 ? (
                  <ul className="space-y-2">
                    {member.sources.map((src, idx) => (
                      <li
                        key={idx}
                        className="flex items-start justify-between gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-700"
                      >
                        <span className="leading-relaxed flex-1">{src}</span>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSource(idx)}
                            className="text-stone-400 hover:text-red-500 transition-colors shrink-0 mt-0.5"
                            title="Remove source"
                          >
                            <X className="size-3.5" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-stone-400 italic">No citations added yet.</p>
                )}

                {addingSourceOpen && canEdit && (
                  <div className="space-y-2 pt-1 border-t border-stone-200">
                    <Input
                      value={newSourceCitation}
                      onChange={(e) => setNewSourceCitation(e.target.value)}
                      placeholder="e.g. Burgerlijke Stand Manado 1872, Act No. 42 — ANRI Microfilm"
                      className="text-xs"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddSource(); }}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddSource} disabled={savingSource || !newSourceCitation.trim()}>
                        {savingSource ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                        {t.saveChanges}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setAddingSourceOpen(false); setNewSourceCitation(''); }}
                      >
                        {t.cancelAction}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GALLERY */}
        {subTab === 'gallery' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#222426] flex items-center gap-2">
                <ImageIcon className="size-5 text-[#73a922]" /> Media &amp; Portraits
              </h2>
              {canEdit && (
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Camera className="size-4" /> Upload Photo
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {member.photoUrl && (
                <div className="rounded-lg border border-stone-300 bg-white overflow-hidden">
                  <div className="aspect-square w-full overflow-hidden">
                    <OptimizedPortrait
                      src={member.photoUrl}
                      alt={member.fullName}
                      gender={member.gender}
                      width={400}
                      priority
                    />
                  </div>
                  <div className="p-3">
                    <div className="font-bold text-sm">{member.fullName}</div>
                    <div className="text-xs text-stone-500">Primary Archival Portrait</div>
                  </div>
                </div>
              )}

              {member.spouses
                .filter((s) => Boolean(s.photoUrl))
                .map((sp) => (
                  <div
                    key={sp.id}
                    className="rounded-lg border border-stone-300 bg-white overflow-hidden"
                  >
                    <div className="aspect-square w-full overflow-hidden">
                      <OptimizedPortrait
                        src={sp.photoUrl}
                        alt={sp.name}
                        gender={member.gender === 'male' ? 'female' : 'male'}
                        width={400}
                        priority
                      />
                    </div>
                    <div className="p-3">
                      <div className="font-bold text-sm">{sp.name}</div>
                      <div className="text-xs text-stone-500">Spouse Portrait</div>
                    </div>
                  </div>
                ))}

              <div className="rounded-lg border border-stone-300 bg-white overflow-hidden">
                <img
                  src="/images/heritage/manado-harbor.jpg"
                  alt="Manado Harbor Heritage"
                  className="aspect-square w-full object-cover"
                />
                <div className="p-3">
                  <div className="font-bold text-sm">Ancestral Region: {member.region}</div>
                  <div className="text-xs text-stone-500">Historical Archival Plate</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LIFESTORY */}
        {subTab === 'lifestory' && (
          <div className="max-w-3xl mx-auto rounded-xl border border-stone-300 bg-white p-6 sm:p-8 space-y-5 shadow-xs">
            <div className="border-b border-stone-200 pb-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#73a922]">
                LifeStory Narrative
              </div>
              <h2 className="font-heritage text-3xl font-bold text-[#222426] mt-1">
                The Story of {member.fullName}
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                {member.birthDate || member.birthYear || 'Unknown'} —{' '}
                {member.deathDate || member.deathYear || 'Present / Unrecorded'} · {member.region}
              </p>
            </div>

            {editingLifeStory && canEdit ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Biography</label>
                  <Textarea
                    value={bioDraft}
                    onChange={(e) => setBioDraft(e.target.value)}
                    className="mt-1.5 min-h-32"
                    placeholder="Write the life story..."
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Occupation / Role</label>
                  <Input
                    value={occupationDraft}
                    onChange={(e) => setOccupationDraft(e.target.value)}
                    className="mt-1.5"
                    placeholder="e.g. Sea Captain &amp; Merchant"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={handleSaveLifeStory} disabled={savingLifeStory}>
                    {savingLifeStory ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    {t.saveChanges}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingLifeStory(false);
                      setBioDraft(member.bio || '');
                      setOccupationDraft(member.occupation || '');
                    }}
                  >
                    {t.cancelAction}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-base leading-relaxed text-stone-800">{member.bio}</p>
                {member.occupation && (
                  <div className="rounded-lg bg-stone-50 border border-stone-200 p-4">
                    <div className="text-xs font-bold uppercase text-stone-500">Vocation &amp; Role</div>
                    <div className="text-sm font-medium text-stone-900 mt-1">{member.occupation}</div>
                  </div>
                )}
              </>
            )}

            {member.spouses.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-stone-800">Marriages &amp; Family Unions</h3>
                {member.spouses.map((sp) => (
                  <p key={sp.id} className="text-sm text-stone-700 leading-relaxed">
                    Married <strong>{sp.name}</strong>
                    {sp.marriageDate ? ` on ${sp.marriageDate}` : ''}
                    {sp.marriagePlace ? ` in ${sp.marriagePlace}` : ''}.{' '}
                    {sp.notes || sp.heritage || ''}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: HERITAGE & DIRECT LINEAGE TRAIL */}
        {subTab === 'heritage' && (
          <div className="space-y-6">
            {/* Direct Ancestral Path to Founder */}
            <div className="rounded-xl border border-stone-300 bg-white p-5 space-y-3">
              <h2 className="text-base font-bold text-[#222426] flex items-center gap-2">
                <Users className="size-4 text-[#73a922]" /> Direct Lineage Path from Jacob Lang (I)
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                {ancestorTrail.map((anc, idx) => (
                  <React.Fragment key={anc.id}>
                    <button
                      type="button"
                      onClick={() => onSelectProfile(anc)}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors cursor-pointer',
                        anc.id === member.id
                          ? 'border-[#73a922] bg-[#f5faed]'
                          : 'border-stone-200 hover:border-stone-400 bg-stone-50'
                      )}
                    >
                      <AvatarThumb
                        photoUrl={anc.photoUrl}
                        name={anc.fullName}
                        gender={anc.gender}
                        size="sm"
                      />
                      <div>
                        <div className="text-xs font-bold text-[#222426]">{anc.fullName}</div>
                        <div className="text-[10px] text-stone-500 font-mono">
                          {anc.code} · Gen {anc.generation}
                        </div>
                      </div>
                    </button>
                    {idx < ancestorTrail.length - 1 && (
                      <ChevronRight className="size-4 text-stone-400 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Matched Heritage Origins from Live APIs */}
            <div className="rounded-xl border border-stone-300 bg-white p-5 space-y-3">
              <h2 className="text-base font-bold text-[#222426] flex items-center gap-2">
                <Dna className="size-4 text-[#0b4a68]" /> Cultural &amp; Surname Heritage Profiles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchedHeritageProfiles.map((h) => (
                  <div
                    key={h.id}
                    className="rounded-lg border border-stone-200 bg-stone-50 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heritage text-xl font-bold">{h.surname}</span>
                      <Badge variant="emerald">{h.heritageGroup}</Badge>
                    </div>
                    <div className="text-xs font-medium text-stone-700">{h.ancestralRegion}</div>
                    <p className="text-xs text-stone-600 leading-relaxed">{h.historicalContext}</p>
                    {h.openArchivesCount !== undefined && (
                      <div className="text-xs font-mono text-[#0b4a68] flex items-center gap-1 pt-1">
                        <Sparkles className="size-3.5 text-amber-600" />
                        {h.openArchivesCount.toLocaleString()} records in OpenArchives.nl
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Editable Heritage Tags & Region */}
            <div className="rounded-xl border border-stone-300 bg-white p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-[#222426] flex items-center gap-2">
                  <Tag className="size-4 text-[#73a922]" /> Heritage Tags &amp; Region
                </h2>
                {canEdit && !editingHeritage && (
                  <Button size="sm" variant="outline" onClick={startEditingHeritage}>
                    <Pencil className="size-3.5" /> {t.editHeritageAction}
                  </Button>
                )}
              </div>

              {editingHeritage && canEdit ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                      Tags <span className="font-normal text-stone-400 normal-case">(comma-separated)</span>
                    </label>
                    <Input
                      value={tagsDraft}
                      onChange={(e) => setTagsDraft(e.target.value)}
                      className="mt-1.5 text-sm"
                      placeholder="e.g. Indo-Minahasan, Tombariri Nobility, Direct Ancestor"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Region</label>
                    <Input
                      value={regionDraft}
                      onChange={(e) => setRegionDraft(e.target.value)}
                      className="mt-1.5 text-sm"
                      placeholder="e.g. Tombariri &amp; Manado, North Sulawesi, Indonesia"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={handleSaveHeritage} disabled={savingHeritage}>
                      {savingHeritage ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                      {t.saveChanges}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingHeritage(false);
                        setTagsDraft(member.heritageTags.join(', '));
                        setRegionDraft(member.region || '');
                      }}
                    >
                      {t.cancelAction}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {member.heritageTags.map((tag) => (
                      <Badge key={tag} variant="emerald" className="text-xs">{tag}</Badge>
                    ))}
                    {member.heritageTags.length === 0 && (
                      <span className="text-xs text-stone-400 italic">No tags yet.</span>
                    )}
                  </div>
                  {member.region && (
                    <div className="flex items-center gap-1.5 text-xs text-stone-500">
                      <MapPin className="size-3.5 text-[#73a922]" />
                      {member.region}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
