'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Download,
  Eye,
  Heart,
  MapPin,
  Plus,
  Route,
  Search,
} from 'lucide-react';
import type { FamilyMemberRecord } from '@/lib/data/lang-genealogy';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedPortrait } from '@/components/ui/OptimizedPortrait';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface MembersDirectoryTableProps {
  members: FamilyMemberRecord[];
  canEdit?: boolean;
  onSelectMember: (member: FamilyMemberRecord) => void;
  onFocusInTree: (memberId: string) => void;
  onAddNew: () => void;
}

export function MembersDirectoryTable({
  members,
  canEdit = true,
  onSelectMember,
  onFocusInTree,
  onAddNew,
}: MembersDirectoryTableProps) {
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [genFilter, setGenFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'generation' | 'birthYear' | 'fullName'>('generation');
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members
      .filter((m) => {
        if (branchFilter !== 'all' && m.branch !== branchFilter) return false;
        if (genFilter !== 'all' && String(m.generation) !== genFilter) return false;
        if (!q) return true;
        return (
          m.fullName.toLowerCase().includes(q) ||
          m.code.toLowerCase().includes(q) ||
          (m.birthPlace || '').toLowerCase().includes(q) ||
          (m.occupation || '').toLowerCase().includes(q) ||
          m.heritageTags.some((t) => t.toLowerCase().includes(q)) ||
          m.spouses.some((s) => s.name.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'generation') {
          cmp = a.generation - b.generation || (a.birthYear ?? 9999) - (b.birthYear ?? 9999);
        } else if (sortBy === 'birthYear') {
          cmp = (a.birthYear ?? 9999) - (b.birthYear ?? 9999);
        } else {
          cmp = a.fullName.localeCompare(b.fullName);
        }
        return sortAsc ? cmp : -cmp;
      });
  }, [members, search, branchFilter, genFilter, sortBy, sortAsc]);

  function toggleSort(field: 'generation' | 'birthYear' | 'fullName') {
    if (sortBy === field) {
      setSortAsc((v) => !v);
    } else {
      setSortBy(field);
      setSortAsc(true);
    }
  }

  function exportCsv() {
    const headers = [
      'Code',
      'Generation',
      'Branch',
      'Full Name',
      'Birth Date',
      'Birth Place',
      'Death Date',
      'Occupation',
      'Spouses',
      'Heritage Tags',
    ];
    const rows = filtered.map((m) => [
      m.code,
      String(m.generation),
      m.branch,
      m.fullName,
      m.birthDate || '',
      m.birthPlace || '',
      m.deathDate || '',
      m.occupation || '',
      m.spouses.map((s) => s.name).join(' / '),
      m.heritageTags.join('; '),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lang-tampemawa-family-directory.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-heritage text-2xl">
              Complete Parenteel Directory ({filtered.length} Members)
            </CardTitle>
            <CardDescription>
              Every documented member of the Jacob Lang & Maria Tampemawa lineage stored in the live
              database.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="size-4" /> Export CSV
            </Button>
            {canEdit && (
              <Button size="sm" onClick={onAddNew}>
                <Plus className="size-4" /> Add Member
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, spouse, birthplace, occupation, or heritage..."
              className="pl-9"
            />
          </div>

          <Select value={genFilter} onValueChange={setGenFilter}>
            <SelectTrigger className="w-[155px]">
              <SelectValue placeholder="Generation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Generations</SelectItem>
              <SelectItem value="1">Generation I</SelectItem>
              <SelectItem value="2">Generation II</SelectItem>
              <SelectItem value="3">Generation III</SelectItem>
              <SelectItem value="4">Generation IV</SelectItem>
            </SelectContent>
          </Select>

          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              <SelectItem value="root">Founding Root</SelectItem>
              <SelectItem value="hendrik">II-a · Hendrik Lang</SelectItem>
              <SelectItem value="joseph">II-b · Joseph Lang</SelectItem>
              <SelectItem value="carolina">II-c · Carolina & Parera</SelectItem>
              <SelectItem value="elisabeth">II-d · Elisabeth & Kuitert</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort('fullName')}
                  className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer"
                >
                  Ancestor <ArrowUpDown className="size-3" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort('generation')}
                  className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer"
                >
                  Code & Gen <ArrowUpDown className="size-3" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort('birthYear')}
                  className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer"
                >
                  Lifespan & Place <ArrowUpDown className="size-3" />
                </button>
              </TableHead>
              <TableHead>Spouse(s)</TableHead>
              <TableHead>Occupation & Heritage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((m) => (
              <TableRow key={m.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full overflow-hidden border border-amber-700/35 shrink-0 bg-stone-200">
                      <OptimizedPortrait
                        src={m.photoUrl}
                        alt={m.fullName}
                        gender={m.gender}
                        width={80}
                        priority
                      />
                    </div>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onSelectMember(m)}
                        className="font-heritage text-base font-bold text-foreground hover:text-[#0b4a68] text-left cursor-pointer"
                      >
                        {m.fullName}
                      </button>
                      <div className="text-[11px] text-muted-foreground capitalize">
                        {m.branch} branch
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant="maritime" className="font-mono text-[11px]">
                      {m.code}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      Generation {m.generation}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="text-xs font-mono text-foreground">
                    {m.birthDate || m.birthYear || '?'}
                    {m.deathDate ? ` – ${m.deathDate}` : ''}
                  </div>
                  {m.birthPlace && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                      <MapPin className="size-3 shrink-0" /> {m.birthPlace}
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  {m.spouses.length > 0 ? (
                    <div className="space-y-1">
                      {m.spouses.map((sp) => (
                        <div key={sp.id} className="flex items-center gap-1.5 text-xs">
                          <Heart className="size-3 text-rose-700/75 shrink-0" />
                          <span className="font-medium">{sp.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell className="max-w-[270px]">
                  {m.occupation && (
                    <div className="text-xs text-foreground/90 line-clamp-1 mb-1">
                      {m.occupation}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {m.heritageTags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="gold" className="text-[10px] px-2 py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2"
                      onClick={() => onSelectMember(m)}
                      title="Open Dossier"
                    >
                      <Eye className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-[#0b4a68]"
                      onClick={() => onFocusInTree(m.id)}
                      title="Focus in Family Tree"
                    >
                      <Route className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
