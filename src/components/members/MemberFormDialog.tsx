'use client';

import React, { useMemo, useState } from 'react';
import { GitBranch, Loader2, Plus, Upload } from 'lucide-react';
import {
  DEFAULT_TREE_ID,
  type FamilyMemberRecord,
  type FamilyTreeGroupRecord,
} from '@/lib/data/lang-genealogy';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/primitives';
import { OptimizedPortrait } from '@/components/ui/OptimizedPortrait';
import { useAuth } from '@/components/auth/AuthContext';
import { canEditTree } from '@/lib/auth/permissions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface MemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingMember: FamilyMemberRecord | null;
  defaultParent: FamilyMemberRecord | null;
  activeTreeId: string;
  familyTrees: FamilyTreeGroupRecord[];
  allMembers: FamilyMemberRecord[];
  onSaved: (member: FamilyMemberRecord) => void;
  onRequestCreateTree: () => void;
}

function MemberFormBody({
  editingMember,
  defaultParent,
  activeTreeId,
  familyTrees,
  allMembers,
  onSaved,
  onRequestCreateTree,
  onClose,
}: Omit<MemberFormDialogProps, 'open' | 'onOpenChange'> & { onClose: () => void }) {
  const p = defaultParent;
  const initialTreeId =
    editingMember?.treeId || p?.treeId || activeTreeId || DEFAULT_TREE_ID;

  const { user, authFetch } = useAuth();
  const editableTrees = useMemo(
    () => familyTrees.filter((t) => canEditTree(t, user)),
    [familyTrees, user]
  );
  const [treeId, setTreeId] = useState<string>(initialTreeId);
  const [firstName, setFirstName] = useState(editingMember?.firstName ?? '');
  const [lastName, setLastName] = useState(editingMember?.lastName ?? p?.lastName ?? '');
  const [code, setCode] = useState(
    editingMember?.code ?? (p ? `${p.code}.new` : 'I')
  );
  const [gender, setGender] = useState<'male' | 'female' | 'unknown'>(
    editingMember?.gender ?? 'male'
  );
  const [generation, setGeneration] = useState(
    String(editingMember?.generation ?? (p ? Math.min(p.generation + 1, 5) : 1))
  );
  const [branch, setBranch] = useState<FamilyMemberRecord['branch']>(
    editingMember?.branch ?? (p && p.branch !== 'root' ? p.branch : 'root')
  );
  const [parentId, setParentId] = useState<string>(
    editingMember ? editingMember.parentId || 'none' : p?.id || 'none'
  );
  const [birthDate, setBirthDate] = useState(editingMember?.birthDate ?? '');
  const [birthYear, setBirthYear] = useState(
    editingMember?.birthYear ? String(editingMember.birthYear) : ''
  );
  const [birthPlace, setBirthPlace] = useState(
    editingMember?.birthPlace ??
      familyTrees.find((t) => t.id === initialTreeId)?.region ??
      'Manado, North Sulawesi, Indonesia'
  );
  const [deathDate, setDeathDate] = useState(editingMember?.deathDate ?? '');
  const [deathYear, setDeathYear] = useState(
    editingMember?.deathYear ? String(editingMember.deathYear) : ''
  );
  const [occupation, setOccupation] = useState(editingMember?.occupation ?? '');
  const [spouseName, setSpouseName] = useState(editingMember?.spouses[0]?.name ?? '');
  const [heritageTags, setHeritageTags] = useState(
    editingMember
      ? editingMember.heritageTags.join(', ')
      : initialTreeId === DEFAULT_TREE_ID
      ? 'Indo-Minahasan, Dutch East Indies'
      : ''
  );
  const [photoUrl, setPhotoUrl] = useState(editingMember?.photoUrl ?? '');
  const [bio, setBio] = useState(editingMember?.bio ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filter lineage parent choices to members of the selected family tree
  const parentCandidates = useMemo(() => {
    return allMembers.filter(
      (m) => (m.treeId || DEFAULT_TREE_ID) === treeId && m.id !== editingMember?.id
    );
  }, [allMembers, treeId, editingMember?.id]);

  function handleTreeChange(nextTreeId: string) {
    setTreeId(nextTreeId);
    const nextTreeMembers = allMembers.filter(
      (m) => (m.treeId || DEFAULT_TREE_ID) === nextTreeId && m.id !== editingMember?.id
    );
    if (nextTreeMembers.length === 0) {
      setParentId('none');
      setGeneration('1');
      setBranch('root');
      if (!editingMember) setCode('I');
    } else if (!nextTreeMembers.some((m) => m.id === parentId)) {
      setParentId(nextTreeMembers[0].id);
    }
    const nextTree = familyTrees.find((t) => t.id === nextTreeId);
    if (nextTree && !editingMember) {
      setBirthPlace(nextTree.region);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await authFetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (res.ok && json.url) {
        setPhotoUrl(json.url);
      } else {
        alert(json.error || 'Upload failed');
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    setSaving(true);
    try {
      const tags = heritageTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const spouses = editingMember?.spouses ? [...editingMember.spouses] : [];
      if (spouseName.trim()) {
        const parts = spouseName.trim().split(/\s+/);
        const surname = parts[parts.length - 1] || spouseName.trim();
        if (spouses.length > 0) {
          spouses[0] = { ...spouses[0], name: spouseName.trim(), surname };
        } else {
          spouses.push({
            id: `sp-${Date.now()}`,
            name: spouseName.trim(),
            surname,
            marriageOrder: 1,
          });
        }
      }

      const payload: Partial<FamilyMemberRecord> = {
        id: editingMember?.id,
        treeId,
        code: code.trim() || `GEN-${generation}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        gender,
        generation: Number(generation) || 1,
        branch,
        parentId: parentId === 'none' ? null : parentId,
        birthDate: birthDate.trim() || undefined,
        birthYear: birthYear ? Number(birthYear) : undefined,
        birthPlace: birthPlace.trim() || undefined,
        deathDate: deathDate.trim() || undefined,
        deathYear: deathYear ? Number(deathYear) : undefined,
        occupation: occupation.trim() || undefined,
        heritageTags: tags,
        region: birthPlace.trim() || 'Archival Lineage',
        photoUrl: photoUrl.trim() || undefined,
        bio: bio.trim(),
        spouses,
        sources: editingMember?.sources || ['Added via Family Archive'],
        sourceUrl:
          editingMember?.sourceUrl ||
          familyTrees.find((t) => t.id === treeId)?.sourceUrl ||
          '',
      };

      const url = editingMember
        ? `/api/members/${encodeURIComponent(editingMember.id)}`
        : '/api/members';
      const method = editingMember ? 'PATCH' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.member) {
        throw new Error(json.error || 'Failed to save member');
      }
      onSaved(json.member);
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Unified Portrait Photograph + Live Gender Toggle Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl border border-border bg-secondary/40 p-3.5">
        <div className="shrink-0">
          <div className="size-20 rounded-full overflow-hidden border-2 border-amber-700/40 shadow-xs bg-stone-200">
            <OptimizedPortrait
              src={photoUrl}
              alt={
                firstName || lastName
                  ? `${firstName} ${lastName}`.trim()
                  : 'Portrait preview'
              }
              gender={gender}
              width={160}
              priority
            />
          </div>
        </div>

        <div className="flex-1 w-full space-y-2.5">
          {/* Portrait upload + URL */}
          <div className="space-y-1.5">
            <Label>Portrait Photograph</Label>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium hover:bg-muted">
                {uploading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>
              <Input
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="or paste Cloudinary / image URL"
                className="h-8 flex-1 text-xs bg-background"
              />
            </div>
          </div>

          {/* Gender Toggle right inside the same card! */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/60">
            <Label className="text-muted-foreground">Gender &amp; Default Portrait</Label>
            <div className="inline-flex rounded-lg border border-border bg-background p-0.5">
              {(
                [
                  { id: 'male', label: 'Male' },
                  { id: 'female', label: 'Female' },
                  { id: 'unknown', label: 'Unknown' },
                ] as const
              ).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGender(g.id)}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer',
                    gender === g.id
                      ? g.id === 'female'
                        ? 'bg-[#a7563f] text-white shadow-xs'
                        : g.id === 'male'
                        ? 'bg-[#3b6b8c] text-white shadow-xs'
                        : 'bg-stone-700 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Family Tree Group Selector + inline "+ New Tree" button */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          <GitBranch className="size-3.5 text-[#73a922]" /> Family Tree Group
        </Label>
        <div className="flex items-center gap-2">
          <Select value={treeId} onValueChange={handleTreeChange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Choose family tree group" />
            </SelectTrigger>
            <SelectContent>
              {(editableTrees.length > 0 ? editableTrees : familyTrees).map((tree) => (
                <SelectItem key={tree.id} value={tree.id}>
                  {tree.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 shrink-0 text-xs"
            onClick={onRequestCreateTree}
          >
            <Plus className="size-3.5 text-[#73a922]" /> New Tree
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="e.g. Willem"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Surname *</Label>
          <Input
            id="lastName"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="e.g. Lang"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="code">Parenteel Code</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. IV-ba"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Generation</Label>
          <Select value={generation} onValueChange={setGeneration}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Gen I</SelectItem>
              <SelectItem value="2">Gen II</SelectItem>
              <SelectItem value="3">Gen III</SelectItem>
              <SelectItem value="4">Gen IV</SelectItem>
              <SelectItem value="5">Gen V</SelectItem>
              <SelectItem value="6">Gen VI</SelectItem>
              <SelectItem value="7">Gen VII</SelectItem>
              <SelectItem value="8">Gen VIII</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Family Branch</Label>
          <Select
            value={branch}
            onValueChange={(v) => setBranch(v as FamilyMemberRecord['branch'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="root">Founding Root</SelectItem>
              <SelectItem value="hendrik">II-a Hendrik</SelectItem>
              <SelectItem value="joseph">II-b Joseph</SelectItem>
              <SelectItem value="carolina">II-c Carolina/Parera</SelectItem>
              <SelectItem value="elisabeth">II-d Elisabeth/Kuitert</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Lineage Parent</Label>
          <Select value={parentId} onValueChange={setParentId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (Founding Root)</SelectItem>
              {parentCandidates.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.code} · {m.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="birthDate">Birth Date</Label>
          <Input
            id="birthDate"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            placeholder="e.g. 12 May 1910"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="birthYear">Birth Year</Label>
          <Input
            id="birthYear"
            type="number"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            placeholder="1910"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deathDate">Death Date</Label>
          <Input
            id="deathDate"
            value={deathDate}
            onChange={(e) => setDeathDate(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deathYear">Death Year</Label>
          <Input
            id="deathYear"
            type="number"
            value={deathYear}
            onChange={(e) => setDeathYear(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="birthPlace">Birthplace / Region</Label>
          <Input
            id="birthPlace"
            value={birthPlace}
            onChange={(e) => setBirthPlace(e.target.value)}
            placeholder="e.g. Manado, North Sulawesi, Indonesia"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="spouseName">Primary Spouse</Label>
          <Input
            id="spouseName"
            value={spouseName}
            onChange={(e) => setSpouseName(e.target.value)}
            placeholder="e.g. Maria Tampemawa"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="occupation">Occupation</Label>
          <Input
            id="occupation"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            placeholder="e.g. Sea Captain, Railway Architect"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="heritageTags">Heritage Tags (comma-separated)</Label>
          <Input
            id="heritageTags"
            value={heritageTags}
            onChange={(e) => setHeritageTags(e.target.value)}
            placeholder="Minahasan, Dutch East Indies"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Biographical Notes</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Historical notes, migration story, archival citations..."
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {editingMember ? 'Save Changes' : 'Add to Family Tree'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function MemberFormDialog({
  open,
  onOpenChange,
  editingMember,
  defaultParent,
  activeTreeId,
  familyTrees,
  allMembers,
  onSaved,
  onRequestCreateTree,
}: MemberFormDialogProps) {
  const formKey = `${open ? 'open' : 'closed'}-${editingMember?.id || 'new'}-${defaultParent?.id || 'root'}-${activeTreeId}-${familyTrees.length}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heritage text-2xl">
            {editingMember ? `Edit ${editingMember.fullName}` : 'Add Ancestor or Descendant'}
          </DialogTitle>
          <DialogDescription>
            Changes are saved directly to the family archive database.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <MemberFormBody
            key={formKey}
            editingMember={editingMember}
            defaultParent={defaultParent}
            activeTreeId={activeTreeId}
            familyTrees={familyTrees}
            allMembers={allMembers}
            onSaved={onSaved}
            onRequestCreateTree={onRequestCreateTree}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
