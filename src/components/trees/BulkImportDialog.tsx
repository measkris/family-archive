'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Code2,
  Download,
  FileSpreadsheet,
  Globe,
  Loader2,
  Sparkles,
  Table2,
  Upload,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/primitives';
import { useAuth } from '@/components/auth/AuthContext';
import { canEditTree } from '@/lib/auth/permissions';
import type { ParsedMemberDraft, SourceParseResult } from '@/lib/import/tree-parser';
import type { FamilyMemberRecord, FamilyTreeGroupRecord } from '@/lib/data/lang-genealogy';

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trees: FamilyTreeGroupRecord[];
  activeTreeId: string;
  onImported: (result: {
    tree: FamilyTreeGroupRecord;
    members: FamilyMemberRecord[];
    mode: 'existing' | 'new';
  }) => void;
}

const PRESET_SOURCES = [
  {
    label: 'BrouwerTree Gen I–II',
    url: 'https://www.brouwertree.com/langgene.html',
    badge: 'HTML Parenteel',
  },
  {
    label: 'BrouwerTree Gen III',
    url: 'https://www.brouwertree.com/langgene3.html',
    badge: 'langgene3',
  },
  {
    label: 'BrouwerTree Gen IV',
    url: 'https://www.brouwertree.com/langgene4.html',
    badge: 'langgene4',
  },
  {
    label: 'BrouwerTree Gen V',
    url: 'https://www.brouwertree.com/langgene5.html',
    badge: 'langgene5',
  },
  {
    label: 'BrouwerTree Gen VI',
    url: 'https://www.brouwertree.com/langgene6.html',
    badge: 'langgene6',
  },
  {
    label: 'BrouwerTree Gen VII',
    url: 'https://www.brouwertree.com/langgene7.html',
    badge: 'langgene7',
  },
  {
    label: 'OpenArchives.nl (Kuitert)',
    url: 'https://api.openarch.nl/1.0/records/search.json?name=Kuitert&number_show=15',
    badge: 'REST JSON',
  },
];

const ACCENT_COLORS: Array<{
  value: NonNullable<FamilyTreeGroupRecord['accentColor']>;
  label: string;
}> = [
  { value: 'maritime', label: 'Maritime Blue' },
  { value: 'emerald', label: 'Sage Green' },
  { value: 'amber', label: 'Heritage Amber' },
  { value: 'rose', label: 'Sepia Rose' },
];

export function BulkImportDialog({
  open,
  onOpenChange,
  trees,
  activeTreeId,
  onImported,
}: BulkImportDialogProps) {
  const { user, authFetch } = useAuth();
  const editableTrees = useMemo(
    () => trees.filter((t) => canEditTree(t, user)),
    [trees, user]
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [sourceTab, setSourceTab] = useState<'file' | 'url'>('file');
  const [previewTab, setPreviewTab] = useState<'table' | 'schema'>('table');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState(PRESET_SOURCES[0].url);
  const [isDragging, setIsDragging] = useState(false);

  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [parseResult, setParseResult] = useState<SourceParseResult | null>(null);

  // Target tree configuration
  const [importMode, setImportMode] = useState<'new' | 'existing'>('new');
  const [targetTreeId, setTargetTreeId] = useState<string>(
    editableTrees.find((t) => t.id === activeTreeId)?.id || editableTrees[0]?.id || ''
  );
  const [newTreeName, setNewTreeName] = useState('');
  const [newTreeSubtitle, setNewTreeSubtitle] = useState('');
  const [newTreeRegion, setNewTreeRegion] = useState('');
  const [newTreeVisibility, setNewTreeVisibility] = useState<'public' | 'private'>('public');
  const [newTreeAccent, setNewTreeAccent] =
    useState<NonNullable<FamilyTreeGroupRecord['accentColor']>>('maritime');

  const resetPreview = () => {
    setParseResult(null);
    setError(null);
  };

  const applyParseResult = (data: SourceParseResult) => {
    setParseResult(data);
    setNewTreeName(data.suggestedTreeName || 'Imported Family Tree');
    setNewTreeSubtitle(data.suggestedSubtitle || '');
    setNewTreeRegion(data.suggestedRegion || '');
    if (trees.length > 0 && !targetTreeId) {
      setTargetTreeId(trees[0].id);
    }
  };

  const handleParseFile = async (fileToParse: File) => {
    setSelectedFile(fileToParse);
    setError(null);
    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.append('file', fileToParse);

      const res = await fetch('/api/trees/parse-source', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse uploaded file.');
      }
      applyParseResult(data as SourceParseResult);
    } catch (err) {
      setParseResult(null);
      setError(err instanceof Error ? err.message : 'Unable to parse file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleParseUrl = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl ?? sourceUrl).trim();
    if (!targetUrl) {
      setError('Please enter a valid URL or API endpoint.');
      return;
    }
    if (overrideUrl) {
      setSourceUrl(overrideUrl);
    }
    setError(null);
    setIsParsing(true);
    try {
      const res = await fetch('/api/trees/parse-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to pull and parse source URL.');
      }
      applyParseResult(data as SourceParseResult);
    } catch (err) {
      setParseResult(null);
      setError(err instanceof Error ? err.message : 'Unable to fetch or parse URL.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleBulkImport = async () => {
    if (!parseResult || parseResult.members.length === 0) return;
    if (importMode === 'new' && !newTreeName.trim()) {
      setError('Please provide a name for the new Family Tree Group.');
      return;
    }
    if (importMode === 'existing' && !targetTreeId) {
      setError('Please select a target Family Tree Group.');
      return;
    }

    setError(null);
    setIsImporting(true);
    try {
      const payload = {
        mode: importMode,
        treeId: importMode === 'existing' ? targetTreeId : undefined,
        newTree:
          importMode === 'new'
            ? {
                name: newTreeName.trim(),
                subtitle: newTreeSubtitle.trim(),
                region: newTreeRegion.trim(),
                sourceUrl: sourceTab === 'url' ? sourceUrl.trim() : undefined,
                visibility: newTreeVisibility,
                accentColor: newTreeAccent,
              }
            : undefined,
        drafts: parseResult.members,
      };

      const res = await authFetch('/api/trees/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Bulk import failed.');
      }

      onImported({
        tree: data.tree as FamilyTreeGroupRecord,
        members: data.members as FamilyMemberRecord[],
        mode: importMode,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk import failed.');
    } finally {
      setIsImporting(false);
    }
  };

  const mappedSchemaPreview = useMemo(() => {
    if (!parseResult) return '';
    const sample = {
      familyTreeGroup: {
        name: importMode === 'new' ? newTreeName || parseResult.suggestedTreeName : targetTreeId,
        subtitle: newTreeSubtitle || parseResult.suggestedSubtitle,
        region: newTreeRegion || parseResult.suggestedRegion,
        sourceUrl: sourceTab === 'url' ? sourceUrl : undefined,
      },
      totalParsedMembers: parseResult.members.length,
      sampleMembers: parseResult.members.slice(0, 3).map((m: ParsedMemberDraft) => ({
        code: m.code,
        fullName: m.fullName,
        gender: m.gender,
        generation: m.generation,
        parentCode: m.parentCode ?? null,
        branch: m.branch,
        birthDate: m.birthDate ?? null,
        birthPlace: m.birthPlace ?? null,
        spouseName: m.spouseName ?? null,
        heritageTags: m.heritageTags,
      })),
    };
    return JSON.stringify(sample, null, 2);
  }, [
    parseResult,
    importMode,
    newTreeName,
    newTreeSubtitle,
    newTreeRegion,
    targetTreeId,
    sourceTab,
    sourceUrl,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-1rem)] sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-[#fcfaf6] border-stone-200">
        <DialogHeader className="px-4 sm:px-6 pt-5 pb-3 border-b border-stone-200 bg-white">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-serif text-stone-900">
            <FileSpreadsheet className="size-5 text-[#73a922]" />
            Bulk Import Family Tree Data
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-stone-600">
            Upload an Excel/CSV/JSON file using our template, or pull genealogy data from an external API/URL and inspect how it parses into a Family Tree Group before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {/* Step 1: Choose Input Source */}
          <Tabs
            value={sourceTab}
            onValueChange={(v) => {
              setSourceTab(v as 'file' | 'url');
              resetPreview();
            }}
          >
            <TabsList className="grid w-full grid-cols-2 bg-stone-100">
              <TabsTrigger value="file" className="gap-1.5 text-xs sm:text-sm">
                <Upload className="size-3.5" />
                Upload Excel / CSV / JSON
              </TabsTrigger>
              <TabsTrigger value="url" className="gap-1.5 text-xs sm:text-sm">
                <Globe className="size-3.5" />
                Pull from API / URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-amber-200/80 bg-amber-50/70 px-3.5 py-2.5">
                <div className="text-xs text-stone-700">
                  <p className="font-semibold text-stone-900">Need the Excel structure?</p>
                  <p className="text-stone-600">
                    Download the ready-to-fill `.xlsx` template with sample rows &amp; field instructions.
                  </p>
                </div>
                <a
                  href="/api/trees/template"
                  download="family-archive-import-template.xlsx"
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-stone-300 bg-white hover:bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-800 shadow-2xs shrink-0 transition-colors"
                >
                  <Download className="size-3.5 text-[#0b4a68]" />
                  Download Excel Template (.xlsx)
                </a>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const dropped = e.dataTransfer.files?.[0];
                  if (dropped) {
                    void handleParseFile(dropped);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
                  isDragging
                    ? 'border-[#73a922] bg-[#f4faea]'
                    : 'border-stone-300 bg-white hover:border-[#0b4a68]/50 hover:bg-stone-50/70'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.json"
                  className="hidden"
                  onChange={(e) => {
                    const picked = e.target.files?.[0];
                    if (picked) {
                      void handleParseFile(picked);
                    }
                  }}
                />
                {isParsing ? (
                  <div className="flex flex-col items-center gap-2 py-2 text-stone-600">
                    <Loader2 className="size-6 animate-spin text-[#0b4a68]" />
                    <span className="text-xs font-medium">Parsing spreadsheet / data structure...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <Upload className="size-6 text-[#0b4a68]" />
                    <p className="text-sm font-medium text-stone-800">
                      {selectedFile
                        ? `Selected: ${selectedFile.name}`
                        : 'Click to browse or drag & drop your file'}
                    </p>
                    <p className="text-xs text-stone-500">
                      Supports `.xlsx`, `.xls`, `.csv`, and `.json` (max ~5 MB)
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://api.openarch.nl/1.0/records/search.json?name=..."
                  className="bg-white text-xs sm:text-sm"
                />
                <Button
                  type="button"
                  onClick={() => void handleParseUrl()}
                  disabled={isParsing}
                  className="bg-[#0b4a68] hover:bg-[#093b54] text-white shrink-0"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5" />
                      Fetch &amp; Parse
                    </>
                  )}
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-stone-500 mr-1">
                  Try sample sources:
                </span>
                {PRESET_SOURCES.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => void handleParseUrl(preset.url)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white hover:bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-700 transition-colors cursor-pointer"
                  >
                    <span>{preset.label}</span>
                    <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-500">
                      {preset.badge}
                    </span>
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 2: Parsed Structure Preview */}
          {parseResult && (
            <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-3.5 sm:p-4 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#73a922]" />
                  <span className="text-sm font-semibold text-stone-900">
                    Parsed Structure Preview
                  </span>
                  <Badge variant="secondary" className="text-[11px]">
                    Format: {parseResult.detectedFormat}
                  </Badge>
                  <Badge className="bg-[#73a922]/15 text-[#4d7c0f] hover:bg-[#73a922]/20 border border-[#73a922]/30 text-[11px]">
                    {parseResult.members.length} members ready
                  </Badge>
                </div>

                <div className="inline-flex rounded-md border border-stone-200 bg-stone-50 p-0.5">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('table')}
                    className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium cursor-pointer ${
                      previewTab === 'table'
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Table2 className="size-3.5" />
                    Parsed Table
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('schema')}
                    className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium cursor-pointer ${
                      previewTab === 'schema'
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Code2 className="size-3.5" />
                    Data Structure &amp; Mapping
                  </button>
                </div>
              </div>

              {parseResult.mappingNotes.length > 0 && (
                <div className="rounded-lg bg-stone-50 border border-stone-200/80 px-3 py-2 text-xs text-stone-600 space-y-1">
                  <p className="font-semibold text-stone-800">How this source maps to Family Archive:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {parseResult.mappingNotes.map((note, idx) => (
                      <li key={idx}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}

              {previewTab === 'table' ? (
                <div className="max-h-60 overflow-auto rounded-lg border border-stone-200">
                  <Table>
                    <TableHeader className="bg-stone-50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="text-[11px] whitespace-nowrap">Code</TableHead>
                        <TableHead className="text-[11px] whitespace-nowrap">Full Name</TableHead>
                        <TableHead className="text-[11px] whitespace-nowrap">Gen</TableHead>
                        <TableHead className="text-[11px] whitespace-nowrap">Parent Code</TableHead>
                        <TableHead className="text-[11px] whitespace-nowrap">Spouse</TableHead>
                        <TableHead className="text-[11px] whitespace-nowrap">Birth</TableHead>
                        <TableHead className="text-[11px] whitespace-nowrap">Branch</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parseResult.members.map((m) => (
                        <TableRow key={m.tempId} className="text-xs">
                          <TableCell className="font-mono text-[11px] font-semibold text-[#0b4a68]">
                            {m.code}
                          </TableCell>
                          <TableCell className="font-medium text-stone-900 whitespace-nowrap">
                            {m.fullName}
                          </TableCell>
                          <TableCell>{m.generation}</TableCell>
                          <TableCell className="font-mono text-[11px] text-stone-500">
                            {m.parentCode || '—'}
                          </TableCell>
                          <TableCell className="text-stone-700 whitespace-nowrap">
                            {m.spouseName || '—'}
                          </TableCell>
                          <TableCell className="text-stone-600 whitespace-nowrap">
                            {[m.birthYear || m.birthDate, m.birthPlace]
                              .filter(Boolean)
                              .join(' · ') || '—'}
                          </TableCell>
                          <TableCell className="capitalize text-stone-600">{m.branch}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                      Raw Source Sample
                    </p>
                    <pre className="max-h-60 overflow-auto rounded-lg border border-stone-200 bg-stone-950 p-3 text-[11px] text-stone-200 font-mono whitespace-pre-wrap">
                      {parseResult.rawSample || 'No raw sample available.'}
                    </pre>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                      Parsed Family Tree Group Schema
                    </p>
                    <pre className="max-h-60 overflow-auto rounded-lg border border-stone-200 bg-stone-950 p-3 text-[11px] text-emerald-300 font-mono whitespace-pre-wrap">
                      {mappedSchemaPreview}
                    </pre>
                  </div>
                </div>
              )}

              {/* Step 3: Target Family Tree Group */}
              <div className="border-t border-stone-200 pt-3 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Label className="text-xs font-semibold text-stone-800">
                    Destination Family Tree Group:
                  </Label>
                  <div className="inline-flex rounded-md border border-stone-200 bg-stone-50 p-0.5">
                    <button
                      type="button"
                      onClick={() => setImportMode('new')}
                      className={`rounded px-2.5 py-1 text-xs font-medium cursor-pointer ${
                        importMode === 'new'
                          ? 'bg-white text-stone-900 shadow-2xs'
                          : 'text-stone-600'
                      }`}
                    >
                      Create New Tree Group
                    </button>
                    {editableTrees.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setImportMode('existing')}
                        className={`rounded px-2.5 py-1 text-xs font-medium cursor-pointer ${
                          importMode === 'existing'
                            ? 'bg-white text-stone-900 shadow-2xs'
                            : 'text-stone-600'
                        }`}
                      >
                        Add to Existing Tree
                      </button>
                    )}
                  </div>
                </div>

                {importMode === 'new' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Family Tree Name *</Label>
                      <Input
                        value={newTreeName}
                        onChange={(e) => setNewTreeName(e.target.value)}
                        placeholder="e.g. Kuitert & Lang Family"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Subtitle / Lineage</Label>
                      <Input
                        value={newTreeSubtitle}
                        onChange={(e) => setNewTreeSubtitle(e.target.value)}
                        placeholder="e.g. Parenteel · 1805–Present"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Region</Label>
                      <Input
                        value={newTreeRegion}
                        onChange={(e) => setNewTreeRegion(e.target.value)}
                        placeholder="e.g. Manado, North Sulawesi, Indonesia"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Card Accent Color</Label>
                      <Select
                        value={newTreeAccent}
                        onValueChange={(v) =>
                          setNewTreeAccent(v as NonNullable<FamilyTreeGroupRecord['accentColor']>)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCENT_COLORS.map((c) => (
                            <SelectItem key={c.value} value={c.value} className="text-xs">
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">Tree Visibility</Label>
                      <Select
                        value={newTreeVisibility}
                        onValueChange={(v) => setNewTreeVisibility(v as 'public' | 'private')}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public" className="text-xs">
                            Public (Read-Only for Public · Editable by Owner &amp; Collaborators)
                          </SelectItem>
                          <SelectItem value="private" className="text-xs">
                            Private (Visible &amp; Editable Only to Signed-In Owner &amp; Collaborators)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 max-w-md">
                    <Label className="text-xs">Select Existing Family Tree Group</Label>
                    <Select value={targetTreeId} onValueChange={setTargetTreeId}>
                      <SelectTrigger className="h-9 text-xs bg-white">
                        <SelectValue placeholder="Choose a tree..." />
                      </SelectTrigger>
                      <SelectContent>
                        {editableTrees.map((t) => (
                          <SelectItem key={t.id} value={t.id} className="text-xs">
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-4 sm:px-6 py-3 border-t border-stone-200 bg-white flex-row justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!parseResult || parseResult.members.length === 0 || isImporting}
            onClick={() => void handleBulkImport()}
            className="bg-[#73a922] hover:bg-[#5e8b1b] text-white text-xs"
          >
            {isImporting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="size-3.5" />
                Import {parseResult ? `${parseResult.members.length} Members` : 'Tree'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
