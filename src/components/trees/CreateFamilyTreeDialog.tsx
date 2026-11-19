'use client';

import React, { useState } from 'react';
import { GitBranch, Loader2, Sparkles, Upload } from 'lucide-react';
import type {
  FamilyMemberRecord,
  FamilyTreeGroupRecord,
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
import { PersonAvatarIllustration } from '@/components/ui/PersonAvatarIllustration';
import { cn } from '@/lib/utils';

interface CreateFamilyTreeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (tree: FamilyTreeGroupRecord, founderMember: FamilyMemberRecord | null) => void;
}

const ACCENT_OPTIONS: Array<{
  id: NonNullable<FamilyTreeGroupRecord['accentColor']>;
  label: string;
  swatch: string;
}> = [
  { id: 'maritime', label: 'Ocean Blue', swatch: 'bg-[#0b4a68]' },
  { id: 'emerald', label: 'Heritage Green', swatch: 'bg-[#73a922]' },
  { id: 'amber', label: 'Antique Gold', swatch: 'bg-amber-600' },
  { id: 'rose', label: 'Archival Rose', swatch: 'bg-rose-700' },
];

export function CreateFamilyTreeDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateFamilyTreeDialogProps) {
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [region, setRegion] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [description, setDescription] = useState('');
  const [accentColor, setAccentColor] =
    useState<NonNullable<FamilyTreeGroupRecord['accentColor']>>('emerald');

  // Optional founding ancestor to seed the new tree immediately
  const [founderFirstName, setFounderFirstName] = useState('');
  const [founderLastName, setFounderLastName] = useState('');
  const [founderGender, setFounderGender] = useState<'male' | 'female' | 'unknown'>('male');
  const [founderBirthYear, setFounderBirthYear] = useState('');
  const [founderSpouse, setFounderSpouse] = useState('');
  const [founderPhotoUrl, setFounderPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setName('');
    setSubtitle('');
    setRegion('');
    setSourceUrl('');
    setDescription('');
    setAccentColor('emerald');
    setFounderFirstName('');
    setFounderLastName('');
    setFounderGender('male');
    setFounderBirthYear('');
    setFounderSpouse('');
    setFounderPhotoUrl('');
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (res.ok && json.url) {
        setFounderPhotoUrl(json.url);
      } else {
        alert(json.error || 'Upload failed');
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const cleanSourceUrl = sourceUrl.trim();
      const sourceLabel = cleanSourceUrl
        ? cleanSourceUrl.replace(/^https?:\/\/(www\.)?/i, '').slice(0, 42)
        : undefined;

      const res = await fetch('/api/trees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          subtitle: subtitle.trim() || 'Family Lineage Collection',
          region: region.trim() || 'Archival Lineage',
          description: description.trim(),
          sourceLabel,
          sourceUrl: cleanSourceUrl || undefined,
          accentColor,
          founder:
            founderFirstName.trim() && founderLastName.trim()
              ? {
                  firstName: founderFirstName.trim(),
                  lastName: founderLastName.trim(),
                  gender: founderGender,
                  birthYear: founderBirthYear ? Number(founderBirthYear) : undefined,
                  birthPlace: region.trim() || undefined,
                  spouseName: founderSpouse.trim() || undefined,
                  photoUrl: founderPhotoUrl.trim() || undefined,
                }
              : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.tree) {
        throw new Error(json.error || 'Failed to create family tree group');
      }
      onCreated(json.tree, json.founderMember || null);
      resetForm();
      onOpenChange(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create family tree');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heritage text-2xl flex items-center gap-2">
            <GitBranch className="size-5 text-[#73a922]" />
            Create New Family Tree Group
          </DialogTitle>
          <DialogDescription>
            Add another family lineage collection to Family Archive. Saved directly to Google Cloud
            Firestore.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="tree-name">Family Tree Group Name *</Label>
              <Input
                id="tree-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Brouwer – Van Dijk Family or Waworuntu Clan"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tree-subtitle">Era / Subtitle</Label>
              <Input
                id="tree-subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Parenteel · Est. 1870 Tondano"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tree-region">Ancestral Region</Label>
              <Input
                id="tree-region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. North Sulawesi / Java / Netherlands"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tree-source">Archive Source URL (optional)</Label>
              <Input
                id="tree-source"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-1.5">
              <Label>Collection Accent</Label>
              <div className="flex items-center gap-2 pt-1">
                {ACCENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAccentColor(opt.id)}
                    title={opt.label}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer',
                      accentColor === opt.id
                        ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                        : 'border-border bg-background hover:bg-muted text-foreground'
                    )}
                  >
                    <span className={cn('size-2.5 rounded-full', opt.swatch)} />
                    <span className="hidden sm:inline">{opt.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tree-desc">Short Description (optional)</Label>
            <Textarea
              id="tree-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Origin story, migration route, or historical notes for this family tree..."
              rows={2}
            />
          </div>

          {/* Optional Founding Ancestor Card with Portrait + Gender Toggle */}
          <div className="rounded-xl border border-border bg-secondary/40 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-[#73a922]" /> Optional: Add Founding Ancestor
                (Gen I)
              </span>
              <span className="text-[11px] text-muted-foreground">
                Starts the chart immediately
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
              <div className="size-16 rounded-full overflow-hidden border border-border shrink-0 bg-stone-200">
                {founderPhotoUrl ? (
                  <img
                    src={founderPhotoUrl}
                    alt="Founder preview"
                    className="size-full object-cover object-top"
                  />
                ) : (
                  <PersonAvatarIllustration gender={founderGender} />
                )}
              </div>

              <div className="flex-1 w-full space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Gender Segmented Toggle */}
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
                        onClick={() => setFounderGender(g.id)}
                        className={cn(
                          'rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer',
                          founderGender === g.id
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

                  <label className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium hover:bg-muted">
                    {uploading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Upload className="size-3.5" />
                    )}
                    Upload Portrait
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Input
                    value={founderFirstName}
                    onChange={(e) => setFounderFirstName(e.target.value)}
                    placeholder="First name"
                    className="h-8 text-xs bg-background"
                  />
                  <Input
                    value={founderLastName}
                    onChange={(e) => setFounderLastName(e.target.value)}
                    placeholder="Surname"
                    className="h-8 text-xs bg-background"
                  />
                  <Input
                    type="number"
                    value={founderBirthYear}
                    onChange={(e) => setFounderBirthYear(e.target.value)}
                    placeholder="Birth year"
                    className="h-8 text-xs bg-background"
                  />
                  <Input
                    value={founderSpouse}
                    onChange={(e) => setFounderSpouse(e.target.value)}
                    placeholder="Spouse (optional)"
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#73a922] hover:bg-[#62911b] text-white"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              Create Family Tree Group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
