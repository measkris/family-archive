'use client';

import React, { useState } from 'react';
import {
  Globe2,
  Loader2,
  Lock,
  MailPlus,
  Shield,
  Trash2,
  Users,
} from 'lucide-react';
import type { FamilyTreeGroupRecord } from '@/lib/data/lang-genealogy';
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
import { Label } from '@/components/ui/primitives';
import { useAuth } from '@/components/auth/AuthContext';

interface TreeShareCollaboratorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tree: FamilyTreeGroupRecord | null;
  onTreeUpdated: (updated: FamilyTreeGroupRecord) => void;
}

export function TreeShareCollaboratorsDialog({
  open,
  onOpenChange,
  tree,
  onTreeUpdated,
}: TreeShareCollaboratorsDialogProps) {
  const { authFetch } = useAuth();
  const [inviteEmail, setInviteEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!tree) return null;

  const visibility = tree.visibility || 'public';
  const collaborators = tree.collaborators || [];

  const handleToggleVisibility = async (nextVisibility: 'public' | 'private') => {
    if (nextVisibility === visibility) return;
    setError(null);
    setBusy(true);
    try {
      const res = await authFetch(`/api/trees/${encodeURIComponent(tree.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: nextVisibility }),
      });
      const json = (await res.json()) as { tree?: FamilyTreeGroupRecord; error?: string };
      if (!res.ok || !json.tree) {
        throw new Error(json.error || 'Failed to update tree visibility');
      }
      onTreeUpdated(json.tree);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update visibility');
    } finally {
      setBusy(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    setError(null);
    setBusy(true);
    try {
      const res = await authFetch(
        `/api/trees/${encodeURIComponent(tree.id)}/collaborators`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );
      const json = (await res.json()) as { tree?: FamilyTreeGroupRecord; error?: string };
      if (!res.ok || !json.tree) {
        throw new Error(json.error || 'Failed to invite collaborator');
      }
      onTreeUpdated(json.tree);
      setInviteEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to invite collaborator');
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveCollaborator = async (email: string) => {
    setError(null);
    setBusy(true);
    try {
      const res = await authFetch(
        `/api/trees/${encodeURIComponent(tree.id)}/collaborators?email=${encodeURIComponent(
          email
        )}`,
        { method: 'DELETE' }
      );
      const json = (await res.json()) as { tree?: FamilyTreeGroupRecord; error?: string };
      if (!res.ok || !json.tree) {
        throw new Error(json.error || 'Failed to remove collaborator');
      }
      onTreeUpdated(json.tree);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove collaborator');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-1.5rem)] sm:max-w-lg bg-[#fcfaf6] border-stone-200">
        <DialogHeader>
          <DialogTitle className="font-heritage text-2xl flex items-center gap-2">
            <Users className="size-5 text-[#0b4a68]" />
            Access &amp; Collaborators
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Control who can view <strong className="text-stone-800">{tree.name}</strong> and invite family members to collaborate and edit together.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Visibility Toggle */}
          <div className="space-y-2 rounded-xl border border-stone-200 bg-white p-3.5">
            <Label className="text-xs font-semibold text-stone-800">
              Tree Visibility
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleToggleVisibility('public')}
                className={`flex items-start gap-2 rounded-lg border p-2.5 text-left transition-all cursor-pointer ${
                  visibility === 'public'
                    ? 'border-[#73a922] bg-[#f4faea] ring-1 ring-[#73a922]/40'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <Globe2
                  className={`size-4 mt-0.5 shrink-0 ${
                    visibility === 'public' ? 'text-[#4d7c0f]' : 'text-stone-400'
                  }`}
                />
                <div>
                  <div className="text-xs font-bold text-stone-900">Public (Read-Only)</div>
                  <div className="text-[11px] text-stone-500">
                    Anyone can view this tree, but the public cannot edit it.
                  </div>
                </div>
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => void handleToggleVisibility('private')}
                className={`flex items-start gap-2 rounded-lg border p-2.5 text-left transition-all cursor-pointer ${
                  visibility === 'private'
                    ? 'border-[#0b4a68] bg-sky-50/70 ring-1 ring-[#0b4a68]/30'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <Lock
                  className={`size-4 mt-0.5 shrink-0 ${
                    visibility === 'private' ? 'text-[#0b4a68]' : 'text-stone-400'
                  }`}
                />
                <div>
                  <div className="text-xs font-bold text-stone-900">Private (Members Only)</div>
                  <div className="text-[11px] text-stone-500">
                    Visible only to you, invited collaborators, and Super Admin.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Invite Collaborator */}
          <div className="space-y-2.5 rounded-xl border border-stone-200 bg-white p-3.5">
            <Label className="text-xs font-semibold text-stone-800">
              Invite Collaborators to Edit
            </Label>
            <form onSubmit={handleInvite} className="flex gap-2">
              <Input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="collaborator@gmail.com"
                className="h-9 text-xs sm:text-sm"
              />
              <Button
                type="submit"
                disabled={busy || !inviteEmail.trim()}
                className="h-9 bg-[#0b4a68] hover:bg-[#093b54] text-white text-xs shrink-0"
              >
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : <MailPlus className="size-3.5" />}
                Invite
              </Button>
            </form>

            <div className="space-y-1.5 pt-1">
              {tree.ownerEmail && (
                <div className="flex items-center justify-between rounded-md bg-stone-50 border border-stone-200/80 px-2.5 py-1.5 text-xs">
                  <span className="font-medium text-stone-800 truncate">{tree.ownerEmail}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    Owner
                  </Badge>
                </div>
              )}

              {collaborators.length === 0 ? (
                <p className="text-[11px] text-stone-500 italic py-1">
                  No collaborators invited yet. Enter a user&apos;s email above so they can sign in and co-edit this tree.
                </p>
              ) : (
                collaborators.map((c) => (
                  <div
                    key={c.email}
                    className="flex items-center justify-between rounded-md bg-stone-50 border border-stone-200/80 px-2.5 py-1.5 text-xs gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-stone-800 truncate">{c.email}</div>
                      <div className="text-[10px] text-stone-500">Can view &amp; edit members</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge className="bg-[#73a922]/15 text-[#4d7c0f] border border-[#73a922]/30 text-[10px]">
                        Editor
                      </Badge>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleRemoveCollaborator(c.email)}
                        title="Remove collaborator"
                        className="rounded p-1 text-stone-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-amber-50/70 border border-amber-200/80 px-3 py-2 text-[11px] text-amber-900">
            <Shield className="size-3.5 shrink-0 text-amber-700" />
            <span>
              The designated Super Admin account retains full edit access across all trees for moderation and support.
            </span>
          </div>

          {error && (
            <p className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
