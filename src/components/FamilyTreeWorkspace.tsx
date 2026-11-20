'use client';

import React, { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  Crown,
  FileSpreadsheet,
  FolderTree,
  GitBranch,
  Globe2,
  Lock,
  LogIn,
  LogOut,
  Network,
  Plus,
  Share2,
  Shield,
  Sparkles,
  Table2,
  Users,
} from 'lucide-react';
import {
  DEFAULT_FAMILY_TREE_GROUP,
  DEFAULT_TREE_ID,
  type ArchivalSourceRecord,
  type FamilyMemberRecord,
  type FamilyTreeGroupRecord,
  type SpouseRecord,
} from '@/lib/data/lang-genealogy';
import type { HeritageOriginRecord } from '@/lib/db/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { OptimizedPortrait } from '@/components/ui/OptimizedPortrait';
import { FamilyArchiveLogo } from '@/components/ui/FamilyArchiveLogo';
import {
  InteractiveFamilyTree,
  type SelectedTreePerson,
} from '@/components/tree/InteractiveFamilyTree';
import { MemberFormDialog } from '@/components/members/MemberFormDialog';
import { CreateFamilyTreeDialog } from '@/components/trees/CreateFamilyTreeDialog';
import { BulkImportDialog } from '@/components/trees/BulkImportDialog';
import { TreeShareCollaboratorsDialog } from '@/components/trees/TreeShareCollaboratorsDialog';
import { AuthProvider, useAuth } from '@/components/auth/AuthContext';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { LanguageToggle, useLanguage } from '@/components/i18n/LanguageContext';
import type { AuthUser, PublicFirebaseConfig } from '@/lib/auth/types';
import {
  canEditTree,
  canManageTreeSettings,
  getTreeAccessBadge,
  isTreeCollaborator,
  isTreeOwner,
} from '@/lib/auth/permissions';
import { cn } from '@/lib/utils';

function TableTabSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="space-y-3 pt-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-12 items-center gap-3 py-2.5 border-b border-border/50"
          >
            <div className="col-span-3 flex items-center gap-2.5">
              <Skeleton className="size-10 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="col-span-2 h-5 w-20 rounded-full" />
            <Skeleton className="col-span-2 h-4 w-28" />
            <Skeleton className="col-span-2 h-4 w-32" />
            <Skeleton className="col-span-3 h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="rounded-xl border border-stone-300 bg-[#f6f5f2] overflow-hidden shadow-lg animate-fade-in">
      <div className="bg-[#484a4c] p-6 space-y-4">
        <div className="flex items-center gap-5 max-w-5xl mx-auto">
          <Skeleton className="size-28 rounded-md bg-white/15 shrink-0" />
          <div className="space-y-2.5 flex-1">
            <Skeleton className="h-8 w-72 bg-white/15" />
            <Skeleton className="h-4 w-80 bg-white/15" />
            <Skeleton className="h-4 w-64 bg-white/15" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-5 w-24 rounded-full bg-white/20" />
              <Skeleton className="h-5 w-28 rounded-full bg-white/20" />
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
        <div className="lg:col-span-5 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <div className="lg:col-span-3 space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
        <div className="lg:col-span-4 space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

const AncestryProfileView = dynamic(
  () => import('@/components/members/AncestryProfileView').then((m) => m.AncestryProfileView),
  { loading: () => <ProfileSkeleton /> }
);
const MembersDirectoryTable = dynamic(
  () => import('@/components/members/MembersDirectoryTable').then((m) => m.MembersDirectoryTable),
  { loading: () => <TableTabSkeleton /> }
);
const HeritageDataTables = dynamic(
  () => import('@/components/heritage/HeritageDataTables').then((m) => m.HeritageDataTables),
  { loading: () => <TableTabSkeleton /> }
);
const PhotoArchiveTimeline = dynamic(
  () => import('@/components/gallery/PhotoArchiveTimeline').then((m) => m.PhotoArchiveTimeline),
  { loading: () => <TableTabSkeleton /> }
);

interface FamilyTreeWorkspaceProps {
  initialUser?: AuthUser | null;
  firebaseConfig?: PublicFirebaseConfig | null;
  initialMembers: FamilyMemberRecord[];
  initialFamilyTrees: FamilyTreeGroupRecord[];
  initialArchivalRecords: ArchivalSourceRecord[];
  initialHeritageOrigins: HeritageOriginRecord[];
}

function spouseToProfileRecord(
  spouse: SpouseRecord,
  partner: FamilyMemberRecord
): FamilyMemberRecord {
  const parts = spouse.name.trim().split(/\s+/);
  const firstName = parts.slice(0, -1).join(' ') || spouse.name;
  const lastName = spouse.surname || parts[parts.length - 1] || spouse.name;
  const birthYearMatch = spouse.birthDate?.match(/\b(1[6-9]\d{2}|20\d{2})\b/);
  const deathYearMatch = spouse.deathDate?.match(/\b(1[6-9]\d{2}|20\d{2})\b/);
  const gender: FamilyMemberRecord['gender'] =
    partner.gender === 'male' ? 'female' : partner.gender === 'female' ? 'male' : 'unknown';

  return {
    id: `spouse-profile-${spouse.id}`,
    treeId: partner.treeId || DEFAULT_TREE_ID,
    code: `${partner.code} · Spouse`,
    firstName,
    lastName,
    fullName: spouse.name,
    gender,
    generation: partner.generation,
    branch: partner.branch,
    parentId: null,
    birthDate: spouse.birthDate,
    birthYear: birthYearMatch ? Number(birthYearMatch[1]) : undefined,
    birthPlace: spouse.birthPlace,
    deathDate: spouse.deathDate,
    deathYear: deathYearMatch ? Number(deathYearMatch[1]) : undefined,
    deathPlace: spouse.deathPlace,
    occupation: spouse.occupation,
    heritageTags: spouse.heritage ? [spouse.heritage] : [],
    region: spouse.birthPlace || partner.region,
    photoUrl: spouse.photoUrl,
    bio:
      spouse.notes ||
      `Spouse of ${partner.fullName}${
        spouse.marriageDate ? `, married ${spouse.marriageDate}` : ''
      }${spouse.marriagePlace ? ` in ${spouse.marriagePlace}` : ''}.`,
    spouses: [
      {
        id: `partner-${partner.id}`,
        name: partner.fullName,
        surname: partner.lastName,
        marriageOrder: spouse.marriageOrder,
        marriageDate: spouse.marriageDate,
        marriagePlace: spouse.marriagePlace,
        birthDate: partner.birthDate,
        birthPlace: partner.birthPlace,
        deathDate: partner.deathDate,
        deathPlace: partner.deathPlace,
        occupation: partner.occupation,
        photoUrl: partner.photoUrl,
      },
    ],
    sources: partner.sources,
    sourceUrl: partner.sourceUrl,
  };
}

const ACCENT_TOP_BAR: Record<NonNullable<FamilyTreeGroupRecord['accentColor']>, string> = {
  maritime: 'from-[#0b4a68] to-[#29b2ee]',
  emerald: 'from-[#4d7c0f] to-[#8bc34a]',
  amber: 'from-amber-700 to-amber-500',
  rose: 'from-rose-800 to-rose-500',
};

export function FamilyTreeWorkspace(props: FamilyTreeWorkspaceProps) {
  const [refreshTick, setRefreshTick] = useState(0);

  return (
    <AuthProvider
      initialUser={props.initialUser ?? null}
      firebaseConfig={props.firebaseConfig ?? null}
      onSessionChanged={() => setRefreshTick((t) => t + 1)}
    >
      <FamilyTreeWorkspaceInner {...props} refreshTick={refreshTick} />
    </AuthProvider>
  );
}

function FamilyTreeWorkspaceInner({
  initialMembers,
  initialFamilyTrees,
  initialArchivalRecords,
  initialHeritageOrigins,
  refreshTick,
}: FamilyTreeWorkspaceProps & { refreshTick: number }) {
  const { user, signOut, authFetch } = useAuth();
  const { t, tc } = useLanguage();
  const [members, setMembers] = useState<FamilyMemberRecord[]>(initialMembers);
  const [familyTrees, setFamilyTrees] = useState<FamilyTreeGroupRecord[]>(
    initialFamilyTrees.length > 0 ? initialFamilyTrees : [DEFAULT_FAMILY_TREE_GROUP]
  );
  const [activeTreeId, setActiveTreeId] = useState<string>(
    initialFamilyTrees[0]?.id || DEFAULT_TREE_ID
  );
  const [activeTab, setActiveTab] = useState<string>('tree');
  const [treeScope, setTreeScope] = useState<'all' | 'mine'>('all');

  // Start with NO default selection so the right details panel stays hidden until the user clicks a person
  const [selectedPerson, setSelectedPerson] = useState<SelectedTreePerson | null>(null);
  const [profileTarget, setProfileTarget] = useState<SelectedTreePerson | null>(null);
  const [focusMemberId, setFocusMemberId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMemberRecord | null>(null);
  const [defaultParent, setDefaultParent] = useState<FamilyMemberRecord | null>(null);
  const [createTreeOpen, setCreateTreeOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [shareTree, setShareTree] = useState<FamilyTreeGroupRecord | null>(null);

  const treesCarouselRef = React.useRef<HTMLDivElement>(null);
  const [activeTreeSlide, setActiveTreeSlide] = useState(0);
  const ancestorsCarouselRef = React.useRef<HTMLDivElement>(null);
  const [activeAncestorDot, setActiveAncestorDot] = useState(0);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!accountMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [accountMenuOpen]);

  // Sync visible trees & members whenever signed-in account changes
  React.useEffect(() => {
    if (refreshTick === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const [treesRes, membersRes] = await Promise.all([
          authFetch('/api/trees'),
          authFetch('/api/members'),
        ]);
        if (!treesRes.ok || !membersRes.ok || cancelled) return;
        const treesJson = (await treesRes.json()) as { trees?: FamilyTreeGroupRecord[] };
        const membersJson = (await membersRes.json()) as { members?: FamilyMemberRecord[] };
        if (cancelled) return;
        if (Array.isArray(treesJson.trees) && treesJson.trees.length > 0) {
          setFamilyTrees(treesJson.trees);
          setActiveTreeId((curr) =>
            treesJson.trees!.some((t) => t.id === curr) ? curr : treesJson.trees![0].id
          );
        }
        if (Array.isArray(membersJson.members)) {
          setMembers(membersJson.members);
        }
      } catch {
        // ignore transient refresh failure
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshTick, authFetch]);

  const myTrees = useMemo(
    () =>
      user
        ? familyTrees.filter((t) => isTreeOwner(t, user) || isTreeCollaborator(t, user))
        : [],
    [familyTrees, user]
  );

  const displayedTrees = useMemo(
    () => (treeScope === 'mine' && user ? myTrees : familyTrees),
    [treeScope, user, myTrees, familyTrees]
  );

  const activeTree = useMemo(
    () =>
      displayedTrees.find((t) => t.id === activeTreeId) ||
      familyTrees.find((t) => t.id === activeTreeId) ||
      displayedTrees[0] ||
      familyTrees[0] ||
      DEFAULT_FAMILY_TREE_GROUP,
    [displayedTrees, familyTrees, activeTreeId]
  );

  const activeCanEdit = useMemo(() => canEditTree(activeTree, user), [activeTree, user]);

  // Members belonging to the currently selected Family Tree Group
  const activeTreeMembers = useMemo(
    () => members.filter((m) => (m.treeId || DEFAULT_TREE_ID) === activeTree.id),
    [members, activeTree.id]
  );

  const handleSelectTreeGroup = useCallback((treeId: string) => {
    setActiveTreeId(treeId);
    setSelectedPerson(null);
    setProfileTarget(null);
    setFocusMemberId(null);
  }, []);

  const handleBulkImported = useCallback(
    (result: {
      tree: FamilyTreeGroupRecord;
      members: FamilyMemberRecord[];
      mode: 'existing' | 'new';
    }) => {
      setFamilyTrees((prev) => {
        const exists = prev.some((t) => t.id === result.tree.id);
        return exists
          ? prev.map((t) => (t.id === result.tree.id ? result.tree : t))
          : [...prev, result.tree];
      });
      setMembers((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const additions = result.members.filter((m) => !existingIds.has(m.id));
        return [...prev, ...additions];
      });
      setActiveTreeId(result.tree.id);
      setSelectedPerson(null);
      setProfileTarget(null);
      setFocusMemberId(null);
    },
    []
  );

  // Resolve fresh profile record (for either a primary member or a spouse!)
  const activeProfileData = useMemo(() => {
    if (!profileTarget) return null;
    if (profileTarget.kind === 'member') {
      const m = members.find((x) => x.id === profileTarget.member.id);
      if (!m) return null;
      return { member: m, editTarget: m, parentForChild: m, traceId: m.id };
    }
    const partner =
      members.find((x) => x.id === profileTarget.partner.id) || profileTarget.partner;
    const freshSpouse =
      partner.spouses.find((s) => s.id === profileTarget.spouse.id) || profileTarget.spouse;
    return {
      member: spouseToProfileRecord(freshSpouse, partner),
      editTarget: partner,
      parentForChild: partner,
      traceId: partner.id,
    };
  }, [profileTarget, members]);

  const handleOpenMemberProfile = useCallback((member: FamilyMemberRecord) => {
    const target: SelectedTreePerson = { kind: 'member', member };
    setSelectedPerson(target);
    setProfileTarget(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenSpouseProfile = useCallback(
    (spouse: SpouseRecord, partner: FamilyMemberRecord) => {
      const target: SelectedTreePerson = { kind: 'spouse', spouse, partner };
      setSelectedPerson(target);
      setProfileTarget(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const handleOpenProfileById = useCallback(
    (memberId: string) => {
      const found = members.find((m) => m.id === memberId);
      if (found) {
        setActiveTreeId(found.treeId || DEFAULT_TREE_ID);
        handleOpenMemberProfile(found);
      }
    },
    [members, handleOpenMemberProfile]
  );

  const handleFocusInTree = useCallback(
    (memberId: string) => {
      setProfileTarget(null);
      setActiveTab('tree');
      const found = members.find((m) => m.id === memberId);
      if (found) {
        setActiveTreeId(found.treeId || DEFAULT_TREE_ID);
        setSelectedPerson({ kind: 'member', member: found });
      }
      setFocusMemberId(memberId);
    },
    [members]
  );

  const handleMemberSaved = useCallback((saved: FamilyMemberRecord) => {
    setMembers((prev) => {
      const exists = prev.some((m) => m.id === saved.id);
      const next = exists
        ? prev.map((m) => (m.id === saved.id ? saved : m))
        : [...prev, saved];
      return next.sort(
        (a, b) => a.generation - b.generation || (a.birthYear ?? 9999) - (b.birthYear ?? 9999)
      );
    });
    if (saved.treeId) {
      setActiveTreeId(saved.treeId);
    }
    setSelectedPerson((curr) =>
      curr?.kind === 'member' && curr.member.id === saved.id
        ? { kind: 'member', member: saved }
        : curr?.kind === 'spouse' && curr.partner.id === saved.id
        ? {
            kind: 'spouse',
            partner: saved,
            spouse: saved.spouses.find((s) => s.id === curr.spouse.id) || curr.spouse,
          }
        : curr
    );
  }, []);

  const handleTreeCreated = useCallback(
    (tree: FamilyTreeGroupRecord, founderMember: FamilyMemberRecord | null) => {
      setFamilyTrees((prev) => [...prev.filter((t) => t.id !== tree.id), tree]);
      if (founderMember) {
        setMembers((prev) => [...prev, founderMember]);
      }
      setActiveTreeId(tree.id);
      setSelectedPerson(null);
      setProfileTarget(null);
      setActiveTab('tree');
    },
    []
  );

  const handleDeleteMember = useCallback(
    async (member: FamilyMemberRecord) => {
      const res = await authFetch(`/api/members/${encodeURIComponent(member.id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== member.id));
        setSelectedPerson((curr) =>
          curr && (curr.kind === 'member' ? curr.member.id : curr.partner.id) === member.id
            ? null
            : curr
        );
        setProfileTarget((curr) =>
          curr && (curr.kind === 'member' ? curr.member.id : curr.partner.id) === member.id
            ? null
            : curr
        );
      } else {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        alert(json.error || 'Failed to delete member');
      }
    },
    [authFetch]
  );

  const featuredAncestors = useMemo(() => {
    const featured = activeTreeMembers.filter((m) => m.isFeatured);
    return (featured.length > 0 ? featured : activeTreeMembers).slice(0, 6);
  }, [activeTreeMembers]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Site Brand Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-stone-200/90 bg-white/95 backdrop-blur-md text-[#182635] shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="mx-auto max-w-[1440px] px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo (transparent, no box) + Title */}
          <button
            type="button"
            onClick={() => {
              setProfileTarget(null);
              setActiveTab('tree');
            }}
            className="flex items-center gap-2 sm:gap-2.5 text-left group cursor-pointer min-w-0"
          >
            <FamilyArchiveLogo className="size-8 sm:size-10 shrink-0 drop-shadow-[0_1px_2px_rgba(11,74,104,0.12)] group-hover:scale-105 transition-transform" />
            <div className="leading-tight min-w-0">
              <div className="font-heritage text-lg sm:text-2xl font-bold tracking-tight text-[#142536] leading-none whitespace-nowrap">
                Family Archive
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium text-[#52697d] tracking-wide mt-0.5 truncate">
                <span className="sm:hidden">{t.brandSubtitleShort}</span>
                <span className="hidden sm:inline">{t.brandSubtitle}</span>
              </div>
            </div>
          </button>

          {/* Right Global Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="hidden xl:inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600">
              <FolderTree className="size-3.5 text-[#0b4a68]" />
              <span>
                {familyTrees.length}{' '}
                {familyTrees.length === 1 ? t.treeGroupSingular : t.treeGroupPlural} ·{' '}
                {members.length} {t.recordsLabel}
              </span>
            </span>

            {user ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="hidden md:inline-flex h-9 px-3 text-xs border-stone-300 bg-white text-stone-800 hover:bg-stone-50"
                  onClick={() => setBulkImportOpen(true)}
                >
                  <FileSpreadsheet className="size-3.5 text-[#73a922]" />
                  <span>{t.bulkImport}</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="hidden md:inline-flex h-9 px-3 text-xs border-stone-300 bg-white text-stone-800 hover:bg-stone-50"
                  onClick={() => setCreateTreeOpen(true)}
                >
                  <GitBranch className="size-3.5 text-[#0b4a68]" />
                  <span>{t.newFamilyTree}</span>
                </Button>

                {activeCanEdit && (
                  <Button
                    size="sm"
                    className="bg-[#73a922] text-white hover:bg-[#62911b] font-semibold h-8 sm:h-9 px-2 sm:px-3.5 text-xs sm:text-sm shadow-xs shrink-0"
                    onClick={() => {
                      setEditingMember(null);
                      const parentCandidate =
                        selectedPerson?.kind === 'member'
                          ? selectedPerson.member
                          : selectedPerson?.kind === 'spouse'
                          ? selectedPerson.partner
                          : activeTreeMembers[0] || null;
                      setDefaultParent(parentCandidate);
                      setFormOpen(true);
                    }}
                  >
                    <Plus className="size-4" />
                    <span className="hidden sm:inline">{t.addMember}</span>
                    <span className="sm:hidden">{t.addShort}</span>
                  </Button>
                )}

                {/* Compact Account Dropdown */}
                <div ref={accountMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setAccountMenuOpen((o) => !o)}
                    aria-expanded={accountMenuOpen}
                    title={user.displayName || user.email}
                    className="inline-flex h-8 sm:h-9 items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 hover:bg-stone-100 pl-1 pr-2 text-xs font-medium text-stone-800 transition-colors cursor-pointer"
                  >
                    <span
                      className={cn(
                        'flex size-6 sm:size-7 items-center justify-center rounded-full text-[11px] font-bold shrink-0',
                        user.isSuperAdmin
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-[#0b4a68] text-white'
                      )}
                    >
                      {user.isSuperAdmin ? (
                        <Crown className="size-3.5 text-amber-700" />
                      ) : (
                        (user.displayName || user.email).slice(0, 1).toUpperCase()
                      )}
                    </span>
                    <span className="hidden sm:inline max-w-[96px] truncate">
                      {user.displayName || user.email.split('@')[0]}
                    </span>
                    <ChevronDown className="size-3.5 text-stone-500 shrink-0" />
                  </button>

                  {accountMenuOpen && (
                    <div className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-stone-200 bg-white shadow-xl p-1.5 text-xs animate-fade-in">
                      <div className="px-2.5 py-2 border-b border-stone-100 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-stone-900 truncate">
                            {user.displayName || user.email.split('@')[0]}
                          </span>
                          {user.isSuperAdmin && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 shrink-0">
                              <Crown className="size-2.5 text-amber-700" />
                              {t.superAdmin}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-500 truncate">{user.email}</div>
                      </div>

                      <div className="py-1 space-y-0.5 md:hidden">
                        <button
                          type="button"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            setBulkImportOpen(true);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-stone-700 hover:bg-stone-100 cursor-pointer"
                        >
                          <FileSpreadsheet className="size-3.5 text-[#73a922]" />
                          {t.bulkImport}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            setCreateTreeOpen(true);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-stone-700 hover:bg-stone-100 cursor-pointer"
                        >
                          <GitBranch className="size-3.5 text-[#0b4a68]" />
                          {t.newFamilyTree}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          void signOut();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left font-medium text-rose-700 hover:bg-rose-50 cursor-pointer"
                      >
                        <LogOut className="size-3.5" />
                        {t.signOut}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <span className="hidden lg:inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-600">
                  <Lock className="size-3 text-stone-500" />
                  {t.readOnlyPublic}
                </span>
                <Button
                  size="sm"
                  onClick={() => setAuthDialogOpen(true)}
                  className="bg-[#0b4a68] hover:bg-[#093b54] text-white font-semibold h-8 sm:h-9 px-2.5 sm:px-4 text-xs sm:text-sm shadow-xs"
                >
                  <LogIn className="size-3.5" />
                  <span className="sm:hidden">{t.signInShort}</span>
                  <span className="hidden sm:inline">{t.signInRegister}</span>
                </Button>
              </>
            )}

            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Homepage Family Tree Groups Directory & Active Collection Section */}
      <section className="relative overflow-hidden border-b border-stone-300/80 bg-gradient-to-r from-[#eef5f8] via-[#f6f4ef] to-[#eef5ec]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 12% 30%, rgba(41,178,238,0.16) 0%, transparent 45%), radial-gradient(circle at 88% 70%, rgba(115,169,34,0.16) 0%, transparent 45%)',
          }}
        />

        <div className="relative mx-auto max-w-[1440px] px-3 sm:px-6 lg:px-8 py-3.5 sm:py-4 space-y-3">
          {/* Family Tree Groups Header */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                <FolderTree className="size-3.5 text-[#0b4a68]" /> {t.treeGroupsLabel}
              </span>
              <Badge variant="outline" className="bg-white/80 text-[10px] font-mono">
                {displayedTrees.length}{' '}
                {displayedTrees.length === 1 ? t.collectionSingular : t.collectionPlural}
              </Badge>

              {user && (
                <div className="inline-flex rounded-full border border-stone-200 bg-white/80 p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setTreeScope('all')}
                    className={cn(
                      'rounded-full px-2.5 py-0.5 font-semibold transition-colors cursor-pointer',
                      treeScope === 'all'
                        ? 'bg-[#0b4a68] text-white'
                        : 'text-stone-600 hover:text-stone-900'
                    )}
                  >
                    {t.allViewable} ({familyTrees.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTreeScope('mine')}
                    className={cn(
                      'rounded-full px-2.5 py-0.5 font-semibold transition-colors cursor-pointer',
                      treeScope === 'mine'
                        ? 'bg-[#73a922] text-white'
                        : 'text-stone-600 hover:text-stone-900'
                    )}
                  >
                    {t.myInvitedTrees} ({myTrees.length})
                  </button>
                </div>
              )}
            </div>

            {user && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBulkImportOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#0b4a68]/35 bg-white/90 hover:bg-sky-50 px-3 py-1 text-xs font-semibold text-[#0b4a68] shadow-2xs transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="size-3.5" /> {t.importExcelUrl}
                </button>
                <button
                  type="button"
                  onClick={() => setCreateTreeOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#73a922]/40 bg-white/90 hover:bg-[#f4faea] px-3 py-1 text-xs font-semibold text-[#4d7c0f] shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="size-3.5" /> {t.addFamilyTreeGroup}
                </button>
              </div>
            )}
          </div>

          {/* Family Tree Group Cards Strip */}
          <div
            ref={treesCarouselRef}
            onScroll={() => {
              const el = treesCarouselRef.current;
              if (!el) return;
              const maxScroll = Math.max(1, el.scrollWidth - el.clientWidth);
              const totalDots = displayedTrees.length + 1;
              const idx = Math.round((el.scrollLeft / maxScroll) * (totalDots - 1));
              setActiveTreeSlide(Math.max(0, Math.min(totalDots - 1, idx)));
            }}
            className="flex items-stretch gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1"
          >
            {displayedTrees.map((tree) => {
              const isSelected = tree.id === activeTree.id;
              const treeMembers = members.filter(
                (m) => (m.treeId || DEFAULT_TREE_ID) === tree.id
              );
              const maxGenCount = treeMembers.reduce(
                (max, m) => Math.max(max, m.generation),
                0
              );
              const previewAvatars = treeMembers.slice(0, 3);
              const accent = ACCENT_TOP_BAR[tree.accentColor || 'maritime'];
              const roleBadge = getTreeAccessBadge(tree, user);
              const canManage = canManageTreeSettings(tree, user);
              const isPrivate = tree.visibility === 'private';

              return (
                <div
                  key={tree.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectTreeGroup(tree.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectTreeGroup(tree.id);
                    }
                  }}
                  className={cn(
                    'group relative w-[86vw] max-w-[340px] sm:w-auto sm:min-w-[305px] sm:max-w-[360px] shrink-0 snap-start rounded-xl border bg-white text-left overflow-hidden transition-all cursor-pointer',
                    isSelected
                      ? 'border-[#0b4a68] ring-2 ring-[#0b4a68]/20 shadow-md'
                      : 'border-stone-300/90 hover:border-stone-400 hover:shadow-sm opacity-90 hover:opacity-100'
                  )}
                >
                  <div className={cn('h-1.5 w-full bg-gradient-to-r', accent)} />

                  <div className="p-3 sm:p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center -space-x-2">
                        {previewAvatars.length > 0 ? (
                          previewAvatars.map((m) => (
                            <div
                              key={m.id}
                              className="size-8 rounded-full overflow-hidden border-2 border-white shadow-xs bg-stone-200 shrink-0"
                            >
                              <OptimizedPortrait
                                src={m.photoUrl}
                                alt={m.fullName}
                                gender={m.gender}
                                width={72}
                                priority
                              />
                            </div>
                          ))
                        ) : (
                          <div className="size-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 shrink-0">
                            <GitBranch className="size-4" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-1">
                        {isPrivate ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-sky-50 border border-sky-200 px-1.5 py-0.5 text-[10px] font-semibold text-[#0b4a68]">
                            <Lock className="size-2.5" /> {t.privateBadge}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
                            <Globe2 className="size-2.5" /> {t.publicBadge}
                          </span>
                        )}

                        {roleBadge === 'owner' && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                            {t.ownerBadge}
                          </span>
                        )}
                        {roleBadge === 'collaborator' && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-800">
                            {t.collaboratorBadge}
                          </span>
                        )}
                        {roleBadge === 'super-admin' && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                            <Shield className="size-2.5" /> {t.adminBadge}
                          </span>
                        )}

                        {isSelected && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#eef7df] border border-[#73a922]/40 px-2 py-0.5 text-[10px] font-bold text-[#3f6212]">
                            <CheckCircle2 className="size-3 text-[#73a922]" /> {t.activeBadge}
                          </span>
                        )}
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-stone-600">
                          {treeMembers.length}{' '}
                          {treeMembers.length === 1 ? t.personSingular : t.personPlural}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h2 className="font-heritage text-lg sm:text-xl font-bold leading-snug text-[#1a2634] group-hover:text-[#0b4a68] transition-colors">
                        {tc(tree.name)}
                      </h2>
                      <p className="text-[11px] text-stone-600 flex items-center gap-1 mt-0.5 truncate">
                        <Sparkles className="size-3 text-[#73a922] shrink-0" />
                        <span className="truncate">{tc(tree.subtitle)}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-stone-200/70 text-[11px] text-stone-500">
                      <span>
                        {maxGenCount > 0
                          ? `${maxGenCount} ${maxGenCount === 1 ? t.generationSingular : t.generationPlural}`
                          : t.emptyTreeReady}
                      </span>

                      <div className="flex items-center gap-2">
                        {canManage && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShareTree(tree);
                            }}
                            className="inline-flex items-center gap-1 rounded-full bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 py-0.5 text-[10px] font-semibold text-[#0b4a68] transition-colors cursor-pointer"
                            title="Visibility & Invite Collaborators"
                          >
                            <Share2 className="size-2.5" />
                            {t.shareButton}
                            {(tree.collaborators?.length || 0) > 0 ? ` (${tree.collaborators!.length})` : ''}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add More Family Tree Group Card (authenticated) OR Sign In prompt (public) */}
            {user ? (
              <button
                type="button"
                onClick={() => setCreateTreeOpen(true)}
                className="group min-w-[200px] sm:min-w-[215px] shrink-0 snap-start rounded-xl border-2 border-dashed border-stone-300 hover:border-[#73a922] bg-white/60 hover:bg-white p-4 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-[#eef7df] text-[#4d7c0f] group-hover:bg-[#73a922] group-hover:text-white transition-colors">
                  <Plus className="size-5" />
                </span>
                <div>
                  <div className="text-xs font-bold text-stone-800 group-hover:text-[#365314]">
                    {t.addFamilyTreeGroup}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    {t.startYourOwnLineage}
                  </div>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthDialogOpen(true)}
                className="group min-w-[210px] sm:min-w-[235px] shrink-0 snap-start rounded-xl border-2 border-dashed border-stone-300 hover:border-[#0b4a68] bg-white/60 hover:bg-white p-4 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-sky-50 text-[#0b4a68] group-hover:bg-[#0b4a68] group-hover:text-white transition-colors">
                  <LogIn className="size-5" />
                </span>
                <div>
                  <div className="text-xs font-bold text-stone-800 group-hover:text-[#0b4a68]">
                    {t.createYourOwnTree}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    {t.signInEmailOrGoogle}
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* Mobile Carousel Dots for Family Tree Groups */}
          <div className="flex sm:hidden items-center justify-center gap-1.5">
            {Array.from({ length: displayedTrees.length + 1 }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Show tree card ${idx + 1}`}
                onClick={() => {
                  const el = treesCarouselRef.current;
                  if (!el) return;
                  const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
                  const totalDots = displayedTrees.length + 1;
                  const left = totalDots > 1 ? (idx / (totalDots - 1)) * maxScroll : 0;
                  el.scrollTo({ left, behavior: 'smooth' });
                  setActiveTreeSlide(idx);
                }}
                className={cn(
                  'h-1.5 rounded-full transition-all cursor-pointer',
                  activeTreeSlide === idx
                    ? 'w-5 bg-[#0b4a68]'
                    : 'w-1.5 bg-stone-300 hover:bg-stone-400'
                )}
              />
            ))}
          </div>

          {/* Key Ancestors Ribbon for Active Family Tree Group */}
          {featuredAncestors.length > 0 && (
            <div className="pt-2 border-t border-stone-300/70 space-y-1.5">
              <div
                ref={ancestorsCarouselRef}
                onScroll={() => {
                  const el = ancestorsCarouselRef.current;
                  if (!el) return;
                  const maxScroll = Math.max(1, el.scrollWidth - el.clientWidth);
                  const dotCount = Math.min(featuredAncestors.length, 3);
                  const idx = Math.round((el.scrollLeft / maxScroll) * (dotCount - 1));
                  setActiveAncestorDot(Math.max(0, Math.min(dotCount - 1, idx)));
                }}
                className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 shrink-0 mr-1">
                  {t.keyAncestors} ({activeTree.name.split(' ')[0]}):
                </span>
                {featuredAncestors.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleOpenMemberProfile(m)}
                    className="inline-flex items-center gap-2 rounded-full border border-stone-300/90 bg-white hover:border-[#29b2ee] hover:shadow-xs pl-1 pr-3 py-0.5 text-xs text-stone-800 transition-all shrink-0 cursor-pointer"
                  >
                    <div className="size-6 rounded-full overflow-hidden border border-[#29b2ee]/50 shrink-0 bg-stone-200">
                      <OptimizedPortrait
                        src={m.photoUrl}
                        alt={m.fullName}
                        gender={m.gender}
                        width={64}
                        priority
                      />
                    </div>
                    <span className="font-semibold">{m.fullName}</span>
                    <span className="font-mono text-[10px] text-[#0b4a68]">{m.code}</span>
                  </button>
                ))}
              </div>

              {featuredAncestors.length > 2 && (
                <div className="flex sm:hidden items-center justify-center gap-1.5">
                  {Array.from({ length: Math.min(featuredAncestors.length, 3) }).map((_, idx, arr) => (
                    <button
                      key={idx}
                      type="button"
                      aria-label={`Scroll key ancestors group ${idx + 1}`}
                      onClick={() => {
                        const el = ancestorsCarouselRef.current;
                        if (!el) return;
                        const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
                        const left = arr.length > 1 ? (idx / (arr.length - 1)) * maxScroll : 0;
                        el.scrollTo({ left, behavior: 'smooth' });
                        setActiveAncestorDot(idx);
                      }}
                      className={cn(
                        'h-1.5 rounded-full transition-all cursor-pointer',
                        activeAncestorDot === idx
                          ? 'w-4 bg-[#73a922]'
                          : 'w-1.5 bg-stone-300 hover:bg-stone-400'
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Main Interactive Workspace */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-3 sm:px-6 lg:px-8 py-4 sm:py-5">
        {activeProfileData ? (
          <AncestryProfileView
            member={activeProfileData.member}
            allMembers={activeTreeMembers}
            archivalRecords={initialArchivalRecords}
            heritageOrigins={initialHeritageOrigins}
            canEdit={activeCanEdit}
            onBackToTree={() => setProfileTarget(null)}
            onSelectProfile={handleOpenMemberProfile}
            onTraceInTree={() => handleFocusInTree(activeProfileData.traceId)}
            onEditMember={() => {
              setEditingMember(activeProfileData.editTarget);
              setDefaultParent(null);
              setFormOpen(true);
            }}
            onAddChild={() => {
              setEditingMember(null);
              setDefaultParent(activeProfileData.parentForChild);
              setFormOpen(true);
            }}
            onDeleteMember={handleDeleteMember}
            onPhotoUpdated={handleMemberSaved}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
              <TabsList className="w-full sm:w-auto h-auto p-1 overflow-x-auto no-scrollbar flex-nowrap justify-start max-w-full">
                <TabsTrigger value="tree" className="py-1.5 sm:py-2 px-3 sm:px-4 text-xs sm:text-sm shrink-0">
                  <Network className="size-4 text-[#73a922]" />
                  {t.tabTreeChart}
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                    {activeTreeMembers.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="heritage" className="py-1.5 sm:py-2 px-3 sm:px-4 text-xs sm:text-sm shrink-0">
                  <Globe2 className="size-4 text-emerald-700" />
                  {t.tabHeritageApis}
                </TabsTrigger>
                <TabsTrigger value="directory" className="py-1.5 sm:py-2 px-3 sm:px-4 text-xs sm:text-sm shrink-0">
                  <Table2 className="size-4 text-amber-700" />
                  {t.tabMembersTable}
                </TabsTrigger>
                <TabsTrigger value="gallery" className="py-1.5 sm:py-2 px-3 sm:px-4 text-xs sm:text-sm shrink-0">
                  <Camera className="size-4 text-rose-700" />
                  {t.tabPhotoArchive}
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="size-3.5 text-[#73a922]" />
                <span>
                  {t.viewingLabel} <strong>{tc(activeTree.name)}</strong> · {t.clickAnyCardToInspect}
                </span>
              </div>
            </div>

            <TabsContent value="tree" className="mt-0">
              {activeTreeMembers.length > 0 ? (
                <InteractiveFamilyTree
                  key={activeTree.id}
                  treeName={activeTree.name}
                  members={activeTreeMembers}
                  canEdit={activeCanEdit}
                  selectedPerson={selectedPerson}
                  focusMemberId={focusMemberId}
                  onSelectPerson={setSelectedPerson}
                  onOpenMemberProfile={handleOpenMemberProfile}
                  onOpenSpouseProfile={handleOpenSpouseProfile}
                  onEditMember={(m) => {
                    setEditingMember(m);
                    setDefaultParent(null);
                    setFormOpen(true);
                  }}
                  onAddChild={(parent) => {
                    setEditingMember(null);
                    setDefaultParent(parent);
                    setFormOpen(true);
                  }}
                  onPhotoUpdated={handleMemberSaved}
                  onClearFocus={() => setFocusMemberId(null)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-stone-700/40 bg-[#494b4d] text-white min-h-[460px] p-8 text-center space-y-4">
                  <span className="flex size-16 items-center justify-center rounded-full bg-white/10 border border-white/20">
                    <GitBranch className="size-8 text-[#8bc34a]" />
                  </span>
                  <div className="space-y-1 max-w-md">
                    <h2 className="font-heritage text-3xl font-bold">{activeTree.name}</h2>
                    <p className="text-sm text-stone-300">
                      This family tree group has no ancestors yet.{' '}
                      {activeCanEdit
                        ? 'Add your first founding ancestor to start building the interactive chart.'
                        : 'Only the tree owner or collaborators can add members.'}
                    </p>
                  </div>
                  {activeCanEdit && (
                    <Button
                      className="bg-[#73a922] hover:bg-[#62911b] text-white font-semibold"
                      onClick={() => {
                        setEditingMember(null);
                        setDefaultParent(null);
                        setFormOpen(true);
                      }}
                    >
                      <Plus className="size-4" /> Add Founding Ancestor
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="heritage" className="mt-0">
              <HeritageDataTables
                initialOrigins={initialHeritageOrigins}
                archivalRecords={initialArchivalRecords}
                members={members}
                onSelectMemberById={handleOpenProfileById}
              />
            </TabsContent>

            <TabsContent value="directory" className="mt-0">
              <MembersDirectoryTable
                members={activeTreeMembers}
                canEdit={activeCanEdit}
                onSelectMember={handleOpenMemberProfile}
                onFocusInTree={handleFocusInTree}
                onAddNew={() => {
                  setEditingMember(null);
                  setDefaultParent(activeTreeMembers[0] || null);
                  setFormOpen(true);
                }}
              />
            </TabsContent>

            <TabsContent value="gallery" className="mt-0">
              <PhotoArchiveTimeline
                members={activeTreeMembers}
                archivalRecords={initialArchivalRecords}
                onSelectMember={handleOpenMemberProfile}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/70 py-4 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-[1440px] px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            <FamilyArchiveLogo className="size-5" />
            <span>
              <strong>Family Archive</strong> · {t.footerTagline}
            </span>
          </span>
          <span className="font-medium text-stone-600">
            Family Archive<sup className="text-[9px] ml-0.5">™</sup> · © {new Date().getFullYear()}{' '}
            Family Archive. {t.allRightsReserved}
          </span>
        </div>
      </footer>

      {/* Add / Edit Member Dialog */}
      <MemberFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingMember={editingMember}
        defaultParent={defaultParent}
        activeTreeId={activeTree.id}
        familyTrees={familyTrees}
        allMembers={members}
        onSaved={handleMemberSaved}
        onRequestCreateTree={() => {
          setCreateTreeOpen(true);
        }}
      />

      {/* Create New Family Tree Group Dialog */}
      <CreateFamilyTreeDialog
        open={createTreeOpen}
        onOpenChange={setCreateTreeOpen}
        onCreated={handleTreeCreated}
      />

      {/* Bulk Import Excel / CSV / JSON / API / URL Dialog */}
      <BulkImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        trees={familyTrees}
        activeTreeId={activeTree.id}
        onImported={handleBulkImported}
      />

      {/* Firebase Email/Password + Google Login / Register Dialog */}
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />

      {/* Tree Visibility & Invite Collaborators Dialog */}
      <TreeShareCollaboratorsDialog
        open={Boolean(shareTree)}
        onOpenChange={(open) => {
          if (!open) setShareTree(null);
        }}
        tree={shareTree}
        onTreeUpdated={(updated) => {
          setFamilyTrees((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
          setShareTree(updated);
        }}
      />
    </div>
  );
}
