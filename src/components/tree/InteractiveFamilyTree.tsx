'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import '@xyflow/react/dist/style.css';
import {
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import {
  ArrowDownUp,
  ArrowLeftRight,
  Briefcase,
  Calendar,
  Camera,
  Dna,
  GitBranch,
  Heart,
  Home,
  Info,
  Leaf,
  Loader2,
  MapPin,
  Maximize2,
  Pencil,
  Plus,
  Route,
  Search,
  UserCheck,
  Users,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { FamilyMemberRecord, SpouseRecord } from '@/lib/data/lang-genealogy';
import { AncestryCoupleNode, type AncestryNodeData } from './AncestryCoupleNode';
import { OptimizedPortrait } from '@/components/ui/OptimizedPortrait';
import { PersonAvatarIllustration } from '@/components/ui/PersonAvatarIllustration';
import { useAuth } from '@/components/auth/AuthContext';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

const AncestralLocationsMap = dynamic(
  () => import('@/components/heritage/AncestralLocationsMap').then((m) => m.AncestralLocationsMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[190px] w-full rounded-lg" />,
  }
);
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type SelectedTreePerson =
  | { kind: 'member'; member: FamilyMemberRecord }
  | { kind: 'spouse'; spouse: SpouseRecord; partner: FamilyMemberRecord };

interface InteractiveFamilyTreeProps {
  treeName?: string;
  members: FamilyMemberRecord[];
  canEdit?: boolean;
  selectedPerson: SelectedTreePerson | null;
  focusMemberId: string | null;
  onSelectPerson: (person: SelectedTreePerson | null) => void;
  onOpenMemberProfile: (member: FamilyMemberRecord) => void;
  onOpenSpouseProfile: (spouse: SpouseRecord, partner: FamilyMemberRecord) => void;
  onEditMember: (member: FamilyMemberRecord) => void;
  onAddChild: (parent: FamilyMemberRecord) => void;
  onPhotoUpdated: (member: FamilyMemberRecord) => void;
  onClearFocus: () => void;
}

const SINGLE_NODE_WIDTH = 132;
const COUPLE_NODE_WIDTH = 264;
const NODE_HEIGHT = 205;

const nodeTypes = {
  ancestryCouple: AncestryCoupleNode,
};

function getRelationshipToFounder(m: FamilyMemberRecord): string {
  if (m.id === 'I') return 'Founding Patriarch · Generation I';
  if (m.generation === 2) {
    return m.gender === 'female' ? 'Daughter of Jacob & Maria' : 'Son of Jacob & Maria';
  }
  if (m.generation === 3) {
    return m.gender === 'female' ? 'Granddaughter of Jacob & Maria' : 'Grandson of Jacob & Maria';
  }
  if (m.generation === 4) {
    return m.gender === 'female'
      ? 'Great-granddaughter of Jacob & Maria'
      : 'Great-grandson of Jacob & Maria';
  }
  return `Generation ${m.generation} Descendant`;
}

function getHiddenByCollapse(
  members: FamilyMemberRecord[],
  collapsedIds: Set<string>
): Set<string> {
  const hidden = new Set<string>();
  if (collapsedIds.size === 0) return hidden;

  const childrenMap = new Map<string, string[]>();
  for (const m of members) {
    if (m.parentId) {
      const list = childrenMap.get(m.parentId) || [];
      list.push(m.id);
      childrenMap.set(m.parentId, list);
    }
  }

  const queue: string[] = [];
  for (const cId of collapsedIds) {
    for (const childId of childrenMap.get(cId) || []) {
      if (!hidden.has(childId)) {
        hidden.add(childId);
        queue.push(childId);
      }
    }
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const childId of childrenMap.get(curr) || []) {
      if (!hidden.has(childId)) {
        hidden.add(childId);
        queue.push(childId);
      }
    }
  }
  return hidden;
}

function getLineageSet(members: FamilyMemberRecord[], targetId: string | null): Set<string> {
  const set = new Set<string>();
  if (!targetId) return set;

  const byId = new Map(members.map((m) => [m.id, m]));
  let curr = byId.get(targetId);
  while (curr) {
    set.add(curr.id);
    curr = curr.parentId ? byId.get(curr.parentId) : undefined;
  }

  const queue = [targetId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    set.add(id);
    for (const m of members) {
      if (m.parentId === id && !set.has(m.id)) {
        set.add(m.id);
        queue.push(m.id);
      }
    }
  }
  return set;
}

function computeAncestryLayout(
  visibleMembers: FamilyMemberRecord[],
  allFilteredMembers: FamilyMemberRecord[],
  direction: 'TB' | 'LR',
  selectedPerson: SelectedTreePerson | null,
  highlightedIds: Set<string>,
  collapsedIds: Set<string>,
  onSelectMember: (m: FamilyMemberRecord) => void,
  onSelectSpouse: (s: SpouseRecord, partner: FamilyMemberRecord) => void,
  onOpenMemberProfile: (m: FamilyMemberRecord) => void,
  onOpenSpouseProfile: (s: SpouseRecord, partner: FamilyMemberRecord) => void,
  onToggleCollapse: (id: string) => void
) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    ranksep: direction === 'TB' ? 88 : 110,
    nodesep: direction === 'TB' ? 30 : 34,
    marginx: 50,
    marginy: 50,
  });

  const allChildrenCount = new Map<string, number>();
  for (const m of allFilteredMembers) {
    if (m.parentId) {
      allChildrenCount.set(m.parentId, (allChildrenCount.get(m.parentId) || 0) + 1);
    }
  }

  const visibleIds = new Set(visibleMembers.map((m) => m.id));
  const widthMap = new Map<string, number>();

  for (const m of visibleMembers) {
    const w = m.spouses.length > 0 ? COUPLE_NODE_WIDTH : SINGLE_NODE_WIDTH;
    widthMap.set(m.id, w);
    g.setNode(m.id, { width: w, height: NODE_HEIGHT });
  }

  const edges: Edge[] = [];
  for (const m of visibleMembers) {
    if (m.parentId && visibleIds.has(m.parentId)) {
      g.setEdge(m.parentId, m.id);
      const isTraced =
        highlightedIds.size > 0 && highlightedIds.has(m.parentId) && highlightedIds.has(m.id);
      const isDimmed = highlightedIds.size > 0 && !isTraced;

      edges.push({
        id: `e-${m.parentId}-${m.id}`,
        source: m.parentId,
        target: m.id,
        type: 'step',
        animated: isTraced,
        style: {
          stroke: isTraced ? '#8bc34a' : '#a8acb0',
          strokeWidth: isTraced ? 2.8 : 1.6,
          opacity: isDimmed ? 0.18 : 0.9,
        },
      });
    }
  }

  dagre.layout(g);

  const selectedMemberId =
    selectedPerson?.kind === 'member' ? selectedPerson.member.id : null;
  const selectedSpouseId =
    selectedPerson?.kind === 'spouse' ? selectedPerson.spouse.id : null;

  const nodes: Node<AncestryNodeData>[] = visibleMembers.map((m) => {
    const pos = g.node(m.id);
    const w = widthMap.get(m.id) ?? SINGLE_NODE_WIDTH;
    const isHighlighted = highlightedIds.has(m.id);
    const isDimmed = highlightedIds.size > 0 && !isHighlighted;

    return {
      id: m.id,
      type: 'ancestryCouple',
      position: {
        x: (pos?.x ?? 0) - w / 2,
        y: (pos?.y ?? 0) - NODE_HEIGHT / 2,
      },
      data: {
        member: m,
        direction,
        isMemberSelected: m.id === selectedMemberId,
        selectedSpouseId:
          selectedSpouseId && m.spouses.some((s) => s.id === selectedSpouseId)
            ? selectedSpouseId
            : null,
        isHighlighted,
        isDimmed,
        isCollapsed: collapsedIds.has(m.id),
        childrenCount: allChildrenCount.get(m.id) || 0,
        relationshipLabel: getRelationshipToFounder(m),
        onSelectMember,
        onSelectSpouse,
        onOpenMemberProfile,
        onOpenSpouseProfile,
        onToggleCollapse,
      },
    };
  });

  return { nodes, edges };
}

function EmptyDataNote({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-stone-300 bg-stone-50/80 px-3 py-2.5 text-xs text-stone-500">
      <Info className="size-3.5 shrink-0 text-stone-400" />
      <span>{text}</span>
    </div>
  );
}

function AncestryTreeCanvasInner({
  treeName = 'Jacob Lang & Maria Tampemawa Family',
  members,
  canEdit = true,
  selectedPerson,
  focusMemberId,
  onSelectPerson,
  onOpenMemberProfile,
  onOpenSpouseProfile,
  onEditMember,
  onAddChild,
  onPhotoUpdated,
  onClearFocus,
}: InteractiveFamilyTreeProps) {
  const { authFetch } = useAuth();
  const { t, tc } = useLanguage();
  const { fitView, setCenter, zoomIn, zoomOut } = useReactFlow();
  const [direction, setDirection] = useState<'TB' | 'LR'>('TB');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [maxGen, setMaxGen] = useState<string>('8');
  const [traceLineage, setTraceLineage] = useState<boolean>(false);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [showMinimap, setShowMinimap] = useState<boolean>(true);
  const [sidebarTab, setSidebarTab] = useState<'connections' | 'heritage'>('connections');
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const filteredMembers = useMemo(() => {
    const genLimit = Number(maxGen) || 8;
    return members.filter((m) => {
      if (m.generation > genLimit) return false;
      if (branchFilter !== 'all') {
        return m.id === 'I' || m.branch === branchFilter;
      }
      return true;
    });
  }, [members, branchFilter, maxGen]);

  const visibleMembers = useMemo(() => {
    const hidden = getHiddenByCollapse(filteredMembers, collapsedIds);
    return filteredMembers.filter((m) => !hidden.has(m.id));
  }, [filteredMembers, collapsedIds]);

  const activeNodeMemberId = selectedPerson
    ? selectedPerson.kind === 'member'
      ? selectedPerson.member.id
      : selectedPerson.partner.id
    : null;

  const highlightedIds = useMemo(() => {
    if (!traceLineage || !activeNodeMemberId) return new Set<string>();
    return getLineageSet(visibleMembers, activeNodeMemberId);
  }, [traceLineage, activeNodeMemberId, visibleMembers]);

  const handleSelectMember = useCallback(
    (m: FamilyMemberRecord) => {
      onSelectPerson({ kind: 'member', member: m });
    },
    [onSelectPerson]
  );

  const handleSelectSpouse = useCallback(
    (spouse: SpouseRecord, partner: FamilyMemberRecord) => {
      onSelectPerson({ kind: 'spouse', spouse, partner });
    },
    [onSelectPerson]
  );

  const layout = useMemo(
    () =>
      computeAncestryLayout(
        visibleMembers,
        filteredMembers,
        direction,
        selectedPerson,
        highlightedIds,
        collapsedIds,
        handleSelectMember,
        handleSelectSpouse,
        onOpenMemberProfile,
        onOpenSpouseProfile,
        toggleCollapse
      ),
    [
      visibleMembers,
      filteredMembers,
      direction,
      selectedPerson,
      highlightedIds,
      collapsedIds,
      handleSelectMember,
      handleSelectSpouse,
      onOpenMemberProfile,
      onOpenSpouseProfile,
      toggleCollapse,
    ]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layout.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layout.edges);

  useEffect(() => {
    setNodes(layout.nodes);
    setEdges(layout.edges);
  }, [layout, setNodes, setEdges]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.16, duration: 420 });
    }, 90);
    return () => clearTimeout(timer);
  }, [direction, branchFilter, maxGen, fitView]);

  const centerOnMemberId = useCallback(
    (memberId: string) => {
      const node = layout.nodes.find((n) => n.id === memberId);
      if (node) {
        const w =
          node.data.member.spouses.length > 0 ? COUPLE_NODE_WIDTH : SINGLE_NODE_WIDTH;
        setCenter(node.position.x + w / 2, node.position.y + NODE_HEIGHT / 2, {
          zoom: 0.95,
          duration: 550,
        });
      }
    },
    [layout.nodes, setCenter]
  );

  useEffect(() => {
    if (!focusMemberId) return;
    centerOnMemberId(focusMemberId);
    onClearFocus();
  }, [focusMemberId, centerOnMemberId, onClearFocus]);

  // Search both primary members AND spouses!
  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: SelectedTreePerson[] = [];
    for (const m of members) {
      if (
        m.fullName.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        (m.birthPlace || '').toLowerCase().includes(q)
      ) {
        results.push({ kind: 'member', member: m });
      }
      for (const sp of m.spouses) {
        if (sp.name.toLowerCase().includes(q)) {
          results.push({ kind: 'spouse', spouse: sp, partner: m });
        }
      }
    }
    return results.slice(0, 8);
  }, [searchQuery, members]);

  const handleJumpToPerson = useCallback(
    (target: SelectedTreePerson) => {
      onSelectPerson(target);
      setSearchQuery('');
      setSearchOpen(false);
      setCollapsedIds(new Set());
      const nodeId = target.kind === 'member' ? target.member.id : target.partner.id;
      setTimeout(() => centerOnMemberId(nodeId), 60);
    },
    [onSelectPerson, centerOnMemberId]
  );

  async function handleQuickPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedPerson) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const up = await authFetch('/api/upload', { method: 'POST', body: fd });
      const uj = await up.json();
      if (!up.ok || !uj.url) throw new Error(uj.error || 'Upload failed');

      if (selectedPerson.kind === 'member') {
        const patch = await authFetch(
          `/api/members/${encodeURIComponent(selectedPerson.member.id)}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoUrl: uj.url }),
          }
        );
        const pj = await patch.json();
        if (patch.ok && pj.member) {
          onPhotoUpdated(pj.member);
          onSelectPerson({ kind: 'member', member: pj.member });
        }
      } else {
        // Update spouse's photoUrl directly inside partner's spouses array in Firestore!
        const updatedSpouses = selectedPerson.partner.spouses.map((s) =>
          s.id === selectedPerson.spouse.id ? { ...s, photoUrl: uj.url } : s
        );
        const patch = await authFetch(
          `/api/members/${encodeURIComponent(selectedPerson.partner.id)}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spouses: updatedSpouses }),
          }
        );
        const pj = await patch.json();
        if (patch.ok && pj.member) {
          onPhotoUpdated(pj.member);
          const nextSpouse =
            pj.member.spouses.find((s: SpouseRecord) => s.id === selectedPerson.spouse.id) ||
            { ...selectedPerson.spouse, photoUrl: uj.url };
          onSelectPerson({ kind: 'spouse', spouse: nextSpouse, partner: pj.member });
        }
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Photo upload failed');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // Derive inspector details for EITHER a primary member OR a spouse
  const inspector = useMemo(() => {
    if (!selectedPerson) return null;

    if (selectedPerson.kind === 'member') {
      const m = selectedPerson.member;
      const parent = m.parentId ? members.find((x) => x.id === m.parentId) || null : null;
      const siblings = m.parentId
        ? members.filter((x) => x.parentId === m.parentId && x.id !== m.id)
        : [];
      const children = members.filter((x) => x.parentId === m.id);
      return {
        key: `member-${m.id}`,
        kind: 'member' as const,
        name: m.fullName,
        badgeLine: `${m.code} · Generation ${m.generation}`,
        subtitle: getRelationshipToFounder(m),
        photoUrl: m.photoUrl,
        gender: m.gender,
        birthDate: m.birthDate || (m.birthYear ? String(m.birthYear) : undefined),
        birthPlace: m.birthPlace,
        deathDate: m.deathDate || (m.deathYear ? String(m.deathYear) : undefined),
        deathPlace: m.deathPlace,
        occupation: m.occupation,
        bio: m.bio,
        heritageTags: m.heritageTags,
        sources: m.sources,
        parent,
        fatherName: m.fatherName,
        motherName: m.motherName,
        spouses: m.spouses,
        siblings,
        children,
        memberRef: m,
        spouseRef: null as SpouseRecord | null,
      };
    }

    const { spouse, partner } = selectedPerson;
    const spouseGender: 'male' | 'female' | 'unknown' =
      partner.gender === 'male' ? 'female' : partner.gender === 'female' ? 'male' : 'unknown';
    const sharedChildren = members.filter((x) => x.parentId === partner.id);

    return {
      key: `spouse-${spouse.id}`,
      kind: 'spouse' as const,
      name: spouse.name,
      badgeLine: `Spouse · Generation ${partner.generation}`,
      subtitle: `Married to ${partner.fullName} (${partner.code})`,
      photoUrl: spouse.photoUrl,
      gender: spouseGender,
      birthDate: spouse.birthDate,
      birthPlace: spouse.birthPlace,
      deathDate: spouse.deathDate,
      deathPlace: spouse.deathPlace,
      marriageDate: spouse.marriageDate,
      marriagePlace: spouse.marriagePlace,
      occupation: spouse.occupation,
      bio: spouse.notes || '',
      heritageTags: spouse.heritage ? [spouse.heritage] : [],
      sources: partner.sources,
      parent: null as FamilyMemberRecord | null,
      fatherName: undefined,
      motherName: undefined,
      spouses: [] as SpouseRecord[],
      siblings: [] as FamilyMemberRecord[],
      children: sharedChildren,
      memberRef: partner,
      spouseRef: spouse,
    };
  }, [selectedPerson, members]);

  return (
    <div className="relative flex h-[70vh] min-h-[500px] sm:h-[78vh] sm:min-h-[620px] w-full rounded-xl border border-stone-700/40 bg-[#494b4d] overflow-hidden shadow-xl">
      {/* Main Ancestry Charcoal Chart Canvas */}
      <div className="relative flex-1 h-full min-w-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onPaneClick={() => onSelectPerson(null)}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.16 }}
          minZoom={0.2}
          maxZoom={1.7}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={26} size={1} color="#5c5f62" />

          {/* Top Floating Ancestry Utility Bar */}
          <Panel position="top-left" className="!m-0 w-full pointer-events-none">
            <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 bg-gradient-to-b from-[#2f3133]/95 to-[#2f3133]/80 backdrop-blur-md px-2.5 sm:px-3.5 py-2 text-white border-b border-white/10 pointer-events-auto">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-[11px] sm:text-xs font-semibold tracking-wide text-stone-100 flex items-center gap-1.5 max-w-[160px] sm:max-w-none truncate">
                  <GitBranch className="size-3.5 text-[#8bc34a] shrink-0" />
                  <span className="truncate">{tc(treeName)}</span>
                </span>

                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger className="h-7 w-auto min-w-[126px] sm:min-w-[155px] max-w-[180px] sm:max-w-none px-2.5 text-[11px] whitespace-nowrap bg-white/10 border-white/15 text-white">
                    <SelectValue placeholder={t.all4Branches} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all4Branches}</SelectItem>
                    <SelectItem value="hendrik">II-a · Hendrik Lang</SelectItem>
                    <SelectItem value="joseph">II-b · Joseph Lang</SelectItem>
                    <SelectItem value="carolina">II-c · Carolina &amp; Parera</SelectItem>
                    <SelectItem value="elisabeth">II-d · Elisabeth &amp; Kuitert</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={maxGen} onValueChange={setMaxGen}>
                  <SelectTrigger className="h-7 w-auto min-w-[104px] sm:min-w-[124px] px-2.5 text-[11px] whitespace-nowrap bg-white/10 border-white/15 text-white">
                    <SelectValue placeholder={t.gen1To4} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">{t.gen1To2}</SelectItem>
                    <SelectItem value="3">{t.gen1To3}</SelectItem>
                    <SelectItem value="4">{t.gen1To4}</SelectItem>
                    <SelectItem value="8">All Gen (I – VIII)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                {/* Ancestry "Find in tree" Pill */}
                <div className="relative">
                  {searchOpen ? (
                    <div className="relative w-56 sm:w-64">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-stone-300" />
                      <Input
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t.findPersonPlaceholder}
                        className="h-7 pl-8 pr-7 text-xs bg-[#232527] border-white/25 text-white placeholder:text-stone-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white cursor-pointer"
                      >
                        <X className="size-3.5" />
                      </button>

                      {searchMatches.length > 0 && (
                        <div className="absolute right-0 top-8 z-50 w-72 rounded-lg border border-stone-300 bg-white text-stone-900 shadow-2xl p-1">
                          {searchMatches.map((item) => {
                            const isMem = item.kind === 'member';
                            const key = isMem ? `m-${item.member.id}` : `s-${item.spouse.id}`;
                            const name = isMem ? item.member.fullName : item.spouse.name;
                            const photo = isMem ? item.member.photoUrl : item.spouse.photoUrl;
                            const gender = isMem
                              ? item.member.gender
                              : item.partner.gender === 'male'
                              ? 'female'
                              : 'male';
                            const sub = isMem
                              ? `${item.member.code} · ${item.member.birthYear || '?'}`
                              : `Spouse of ${item.partner.fullName}`;

                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => handleJumpToPerson(item)}
                                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-stone-100 cursor-pointer"
                              >
                                <div className="size-7 rounded overflow-hidden shrink-0">
                                  <OptimizedPortrait
                                    src={photo}
                                    alt={name}
                                    gender={gender}
                                    width={64}
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold truncate">{name}</div>
                                  <div className="text-[10px] text-stone-500 truncate">{sub}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSearchOpen(true)}
                      className="inline-flex h-7 items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 px-3 text-xs font-medium text-white transition-colors cursor-pointer"
                    >
                      <Search className="size-3.5" /> {t.findInTree}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Panel>

          {/* Left Floating Ancestry Vertical Tool Rail */}
          <Panel position="top-left" className="!top-14 !left-3 !m-0">
            <div className="flex flex-col items-center gap-1 rounded-lg bg-[#2e3032]/95 border border-white/15 p-1.5 shadow-xl text-stone-200">
              <button
                type="button"
                onClick={() => setDirection((d) => (d === 'TB' ? 'LR' : 'TB'))}
                title={
                  direction === 'TB'
                    ? 'Switch to Horizontal Pedigree Layout'
                    : 'Switch to Vertical Family Layout'
                }
                className="flex size-8 items-center justify-center rounded-md hover:bg-white/15 transition-colors cursor-pointer"
              >
                {direction === 'TB' ? (
                  <ArrowLeftRight className="size-4" />
                ) : (
                  <ArrowDownUp className="size-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setTraceLineage((v) => !v)}
                disabled={!selectedPerson}
                title={
                  selectedPerson
                    ? 'Highlight Direct Ancestors & Descendants'
                    : 'Select a person first to trace lineage'
                }
                className={cn(
                  'flex size-8 items-center justify-center rounded-md transition-colors cursor-pointer disabled:opacity-40',
                  traceLineage
                    ? 'bg-[#73a922] text-white'
                    : 'hover:bg-white/15 text-stone-200'
                )}
              >
                <Route className="size-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const root = members.find((m) => m.id === 'I') || members[0];
                  if (root) {
                    setCollapsedIds(new Set());
                    centerOnMemberId(root.id);
                  }
                }}
                title="Center on Founding Couple (Jacob Lang · I)"
                className="flex size-8 items-center justify-center rounded-md hover:bg-white/15 transition-colors cursor-pointer"
              >
                <Home className="size-4" />
              </button>

              <div className="my-1 h-px w-5 bg-white/15" />

              <button
                type="button"
                onClick={() => zoomIn({ duration: 250 })}
                title="Zoom In"
                className="flex size-8 items-center justify-center rounded-md hover:bg-white/15 transition-colors cursor-pointer"
              >
                <ZoomIn className="size-4" />
              </button>

              <button
                type="button"
                onClick={() => zoomOut({ duration: 250 })}
                title="Zoom Out"
                className="flex size-8 items-center justify-center rounded-md hover:bg-white/15 transition-colors cursor-pointer"
              >
                <ZoomOut className="size-4" />
              </button>

              <button
                type="button"
                onClick={() => fitView({ padding: 0.16, duration: 350 })}
                title="Fit Entire Tree to View"
                className="flex size-8 items-center justify-center rounded-md hover:bg-white/15 transition-colors cursor-pointer"
              >
                <Maximize2 className="size-4" />
              </button>
            </div>
          </Panel>

          {/* Bottom-Left Minimap — high-contrast (hidden on very small phones) */}
          {showMinimap && (
            <Panel position="bottom-left" className="!m-3 hidden sm:block">
              <div className="relative rounded-lg overflow-hidden border-2 border-[#1f2528] bg-[#f1efe9] shadow-xl">
                <button
                  type="button"
                  onClick={() => setShowMinimap(false)}
                  title="Hide minimap"
                  className="absolute top-1 right-1 z-10 flex size-5 items-center justify-center rounded bg-[#1f2528]/85 text-stone-100 hover:bg-black cursor-pointer"
                >
                  <X className="size-3" />
                </button>
                <MiniMap
                  pannable
                  zoomable
                  bgColor="#f1efe9"
                  style={{
                    position: 'relative',
                    margin: 0,
                    width: 190,
                    height: 120,
                    border: 'none',
                  }}
                  maskColor="rgba(20, 30, 38, 0.38)"
                  maskStrokeColor="#4d7c0f"
                  maskStrokeWidth={3}
                  nodeStrokeColor="#11181d"
                  nodeStrokeWidth={2}
                  nodeBorderRadius={2}
                  nodeColor={(node) => {
                    const m = (node.data as AncestryNodeData)?.member;
                    if (!m) return '#1f2528';
                    if (m.id === activeNodeMemberId) return '#4d7c0f';
                    return '#2b343b';
                  }}
                />
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* Right Slide-In Details Panel — full-width overlay on mobile, side panel on md+ */}
      {inspector && (
        <aside
          key={inspector.key}
          className="absolute inset-0 md:static w-full md:w-[360px] shrink-0 h-full bg-white text-[#222426] md:border-l border-stone-300 flex flex-col overflow-hidden z-30 md:z-20 animate-slide-in-right"
        >
          {/* Quick Person Header */}
          <div className="p-4 border-b border-stone-200 bg-[#faf9f7]">
            <div className="flex items-start justify-between gap-2 mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                {inspector.badgeLine}
              </span>
              <button
                type="button"
                onClick={() => onSelectPerson(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
                title="Close details"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex items-start gap-3">
              <div className="relative shrink-0">
                <div className="size-16 rounded-md overflow-hidden border border-stone-300 shadow-xs">
                  <OptimizedPortrait
                    src={inspector.photoUrl}
                    alt={inspector.name}
                    gender={inspector.gender}
                    width={180}
                    priority
                  />
                </div>
                {canEdit && (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      title="Upload portrait photo"
                      className="absolute -bottom-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-[#2e3032] text-white shadow hover:bg-black cursor-pointer"
                    >
                      {uploadingPhoto ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Camera className="size-3" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleQuickPhotoUpload}
                    />
                  </>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="font-heritage text-xl font-bold leading-tight text-[#1e2022]">
                  {inspector.name}
                </h2>
                <p className="text-xs text-stone-600 mt-0.5">{tc(inspector.subtitle)}</p>
                <p className="font-mono text-[11px] text-stone-500 mt-1">
                  {inspector.birthDate || inspector.deathDate
                    ? `${inspector.birthDate || 'Unknown birth'}${
                        inspector.deathDate ? ` — ${inspector.deathDate}` : ''
                      }`
                    : 'No birth or death dates recorded'}
                </p>
              </div>
            </div>

            {/* Primary Actions */}
            <div className="mt-3.5 flex items-center gap-1.5">
              <Button
                size="sm"
                className="flex-1 bg-[#73a922] hover:bg-[#62911b] text-white font-semibold h-8 text-xs shadow-xs"
                onClick={() => {
                  if (inspector.kind === 'member') {
                    onOpenMemberProfile(inspector.memberRef);
                  } else if (inspector.spouseRef) {
                    onOpenSpouseProfile(inspector.spouseRef, inspector.memberRef);
                  }
                }}
              >
                <UserCheck className="size-3.5" /> {t.fullProfile}
              </Button>
              {canEdit && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 text-xs"
                    onClick={() => onEditMember(inspector.memberRef)}
                    title={inspector.kind === 'spouse' ? 'Edit couple record' : 'Edit person'}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 text-xs"
                    onClick={() => onAddChild(inspector.memberRef)}
                    title="Add child"
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2.5 text-xs"
                onClick={() => centerOnMemberId(inspector.memberRef.id)}
                title="Center tree on this person"
              >
                <MapPin className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Green-Underlined Tabs inside Right Panel */}
          <div className="flex border-b border-stone-200 px-4 bg-white">
            <button
              type="button"
              onClick={() => setSidebarTab('connections')}
              className={cn(
                'flex items-center gap-1.5 py-2.5 pr-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer',
                sidebarTab === 'connections'
                  ? 'border-[#73a922] text-[#1e2022]'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              )}
            >
              {t.detailsAndFamily}
              <span className="rounded bg-[#73a922] px-1.5 py-0.2 text-[10px] text-white font-mono">
                {(inspector.parent ? 1 : 0) +
                  inspector.siblings.length +
                  inspector.children.length +
                  (inspector.kind === 'spouse' ? 1 : inspector.spouses.length)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSidebarTab('heritage')}
              className={cn(
                'flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer',
                sidebarTab === 'heritage'
                  ? 'border-[#73a922] text-[#1e2022]'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              )}
            >
              {t.heritageAndSources}
              <span className="rounded bg-stone-200 px-1.5 py-0.2 text-[10px] text-stone-700 font-mono">
                {inspector.sources.length}
              </span>
            </button>
          </div>

          {/* Scrollable Panel Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {sidebarTab === 'connections' ? (
              <>
                {/* Vital Summary Card (always visible, shows "No data recorded" cleanly if missing) */}
                <div className="rounded-lg border border-stone-200 bg-stone-50/70 p-3 space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <Calendar className="size-3.5 text-[#0b4a68] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="font-semibold text-stone-700">{t.bornLabel}: </span>
                      <span className={inspector.birthDate || inspector.birthPlace ? 'text-stone-900' : 'text-stone-400 italic'}>
                        {[inspector.birthDate, tc(inspector.birthPlace)].filter(Boolean).join(' · ') ||
                          t.noBirthData}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar className="size-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="font-semibold text-stone-700">{t.diedLabel}: </span>
                      <span className={inspector.deathDate || inspector.deathPlace ? 'text-stone-900' : 'text-stone-400 italic'}>
                        {[inspector.deathDate, tc(inspector.deathPlace)].filter(Boolean).join(' · ') ||
                          t.noDeathData}
                      </span>
                    </div>
                  </div>

                  {inspector.kind === 'spouse' && (
                    <div className="flex items-start gap-2">
                      <Heart className="size-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-semibold text-stone-700">{t.marriageLabel}: </span>
                        <span
                          className={
                            inspector.marriageDate || inspector.marriagePlace
                              ? 'text-stone-900'
                              : 'text-stone-400 italic'
                          }
                        >
                          {[inspector.marriageDate, tc(inspector.marriagePlace)]
                            .filter(Boolean)
                            .join(' · ') || '—'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <Briefcase className="size-3.5 text-stone-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="font-semibold text-stone-700">{t.occupationLabel}: </span>
                      <span className={inspector.occupation ? 'text-stone-900' : 'text-stone-400 italic'}>
                        {tc(inspector.occupation) || t.noOccupationData}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Interactive Pin Map inside Right Inspector Drawer */}
                {(inspector.birthPlace || inspector.deathPlace || inspector.memberRef.region) && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                        <MapPin className="size-3 text-[#73a922]" />
                        {t.ancestralMapLocation}
                      </h4>
                      <span className="text-[10px] font-medium text-[#0b4a68] truncate max-w-[165px]">
                        {tc(inspector.birthPlace || inspector.memberRef.region)}
                      </span>
                    </div>
                    <AncestralLocationsMap
                      members={members}
                      singleLocationText={inspector.birthPlace || inspector.memberRef.region}
                      secondaryLocationText={inspector.deathPlace}
                      personName={inspector.name}
                      heightClass="h-[190px]"
                    />
                  </div>
                )}

                {/* Partner card when inspecting a Spouse */}
                {inspector.kind === 'spouse' && (
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                      <Heart className="size-3 text-rose-600" /> Spouse in Lineage
                    </h4>
                    <button
                      type="button"
                      onClick={() =>
                        handleJumpToPerson({ kind: 'member', member: inspector.memberRef })
                      }
                      className="flex w-full items-center gap-2.5 rounded-lg border border-stone-200 hover:border-[#73a922] bg-white p-2.5 text-left transition-colors cursor-pointer"
                    >
                      <div className="size-9 rounded-full overflow-hidden border border-stone-200 shrink-0">
                        <OptimizedPortrait
                          src={inspector.memberRef.photoUrl}
                          alt={inspector.memberRef.fullName}
                          gender={inspector.memberRef.gender}
                          width={96}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-stone-900 truncate">
                          {inspector.memberRef.fullName}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {inspector.memberRef.code} · Click to inspect partner
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {/* Parents (for primary members) */}
                {inspector.kind === 'member' && (
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      Parents
                    </h4>
                    {inspector.parent ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleJumpToPerson({ kind: 'member', member: inspector.parent! })
                        }
                        className="flex w-full items-center gap-2.5 rounded-lg border border-stone-200 hover:border-[#73a922] bg-white p-2.5 text-left transition-colors cursor-pointer"
                      >
                        <div className="size-9 rounded-full overflow-hidden border border-stone-200 shrink-0">
                          <OptimizedPortrait
                            src={inspector.parent.photoUrl}
                            alt={inspector.parent.fullName}
                            gender={inspector.parent.gender}
                            width={96}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-stone-900 truncate">
                            {inspector.fatherName && inspector.motherName
                              ? `${inspector.fatherName} & ${inspector.motherName}`
                              : inspector.parent.fullName}
                          </div>
                          <div className="text-[11px] text-stone-500">
                            {inspector.parent.code} · Jump to parent
                          </div>
                        </div>
                      </button>
                    ) : (
                      <EmptyDataNote text="Founding ancestor — no parents recorded in archive." />
                    )}
                  </div>
                )}

                {/* Spouses (for primary members) */}
                {inspector.kind === 'member' && (
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                      <Heart className="size-3 text-rose-600" /> Spouse
                      {inspector.spouses.length > 1 ? 's' : ''}
                    </h4>
                    {inspector.spouses.length > 0 ? (
                      inspector.spouses.map((sp) => (
                        <button
                          key={sp.id}
                          type="button"
                          onClick={() =>
                            handleSelectSpouse(sp, inspector.memberRef)
                          }
                          className="flex w-full items-center gap-2.5 rounded-lg border border-stone-200 hover:border-[#73a922] bg-stone-50 hover:bg-[#f7faf2] p-2.5 text-left transition-colors cursor-pointer"
                        >
                          <div className="size-9 rounded-full overflow-hidden border border-stone-200 shrink-0">
                            {sp.photoUrl ? (
                              <OptimizedPortrait
                                src={sp.photoUrl}
                                alt={sp.name}
                                gender={inspector.gender === 'male' ? 'female' : 'male'}
                                width={96}
                              />
                            ) : (
                              <PersonAvatarIllustration
                                gender={inspector.gender === 'male' ? 'female' : 'male'}
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-stone-900 truncate">
                              {sp.name}
                            </div>
                            <div className="text-[11px] text-stone-500 truncate">
                              {sp.marriageDate
                                ? `m. ${sp.marriageDate}`
                                : sp.heritage || 'Click to view spouse details'}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <EmptyDataNote text="No spouse recorded for this person." />
                    )}
                  </div>
                )}

                {/* Children */}
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                    <Users className="size-3 text-[#73a922]" /> Children (
                    {inspector.children.length})
                  </h4>
                  {inspector.children.length > 0 ? (
                    <div className="space-y-1.5">
                      {inspector.children.map((child) => (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => handleJumpToPerson({ kind: 'member', member: child })}
                          className="flex w-full items-center gap-2.5 rounded-lg border border-stone-200 hover:border-[#73a922] hover:bg-[#f7faf2] bg-white p-2.5 text-left transition-colors cursor-pointer"
                        >
                          <div className="size-9 rounded-full overflow-hidden border border-stone-200 shrink-0">
                            <OptimizedPortrait
                              src={child.photoUrl}
                              alt={child.fullName}
                              gender={child.gender}
                              width={96}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-stone-900 truncate">
                              {child.fullName}
                            </div>
                            <div className="text-[11px] text-stone-500 truncate">
                              {child.birthYear || '?'}
                              {child.deathYear ? `–${child.deathYear}` : ''} ·{' '}
                              {child.birthPlace || child.region || 'Location unrecorded'}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <EmptyDataNote text="No children recorded in this tree yet." />
                  )}
                </div>

                {/* Siblings */}
                {inspector.kind === 'member' && inspector.siblings.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      Siblings ({inspector.siblings.length})
                    </h4>
                    <div className="space-y-1">
                      {inspector.siblings.map((sib) => (
                        <button
                          key={sib.id}
                          type="button"
                          onClick={() => handleJumpToPerson({ kind: 'member', member: sib })}
                          className="flex w-full items-center justify-between rounded-md border border-stone-200/80 hover:border-[#73a922] px-2.5 py-1.5 text-left text-xs cursor-pointer"
                        >
                          <span className="font-medium text-stone-800 truncate">
                            {sib.fullName}
                          </span>
                          <span className="font-mono text-[10px] text-stone-500 shrink-0 ml-2">
                            {sib.birthYear || '?'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-[#73a922]/30 bg-[#f6faef] p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#3f6212]">
                    <Dna className="size-4 text-[#73a922]" /> Heritage &amp; Biography
                  </div>
                  {inspector.heritageTags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {inspector.heritageTags.map((tag) => (
                        <Badge key={tag} variant="emerald" className="text-[11px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500 italic">No heritage tags recorded yet.</p>
                  )}
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {inspector.bio || 'No biographical notes recorded yet for this person.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
                    <Leaf className="size-4 text-[#73a922]" /> Archival Sources &amp; Hints (
                    {inspector.sources.length})
                  </div>
                  {inspector.sources.length > 0 ? (
                    <ul className="space-y-1.5 text-xs text-stone-600">
                      {inspector.sources.map((src, idx) => (
                        <li
                          key={idx}
                          className="rounded-md border border-stone-200 bg-stone-50 p-2 leading-snug"
                        >
                          {src}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyDataNote text="No archival citations recorded yet." />
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs border-[#73a922] text-[#4d7c0f] hover:bg-[#f6faef]"
                    onClick={() => {
                      if (inspector.kind === 'member') {
                        onOpenMemberProfile(inspector.memberRef);
                      } else if (inspector.spouseRef) {
                        onOpenSpouseProfile(inspector.spouseRef, inspector.memberRef);
                      }
                    }}
                  >
                    Open Full Profile &amp; Live OpenArchives Hints
                  </Button>
                </div>
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

export function InteractiveFamilyTree(props: InteractiveFamilyTreeProps) {
  return (
    <ReactFlowProvider>
      <AncestryTreeCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
