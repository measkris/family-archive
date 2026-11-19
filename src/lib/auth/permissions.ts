import type { FamilyTreeGroupRecord } from '@/lib/data/lang-genealogy';
import type { AuthUser } from './types';

export function normalizeEmail(email?: string | null): string {
  return (email || '').trim().toLowerCase();
}

export function isTreeOwner(tree: FamilyTreeGroupRecord, user: AuthUser | null): boolean {
  if (!user) return false;
  if (tree.ownerId && tree.ownerId === user.uid) return true;
  if (
    tree.ownerEmail &&
    user.email &&
    normalizeEmail(tree.ownerEmail) === normalizeEmail(user.email)
  ) {
    return true;
  }
  return false;
}

export function isTreeCollaborator(tree: FamilyTreeGroupRecord, user: AuthUser | null): boolean {
  if (!user) return false;
  const userEmail = normalizeEmail(user.email);
  return (tree.collaborators || []).some(
    (c) => (c.uid && c.uid === user.uid) || (userEmail && normalizeEmail(c.email) === userEmail)
  );
}

/**
 * Visibility rules:
 * - Public trees ('public' or legacy undefined) can be viewed by anyone (read-only for public visitors).
 * - Private trees ('private') can ONLY be viewed by Super Admin, the Owner, or invited Collaborators.
 */
export function canViewTree(tree: FamilyTreeGroupRecord, user: AuthUser | null): boolean {
  if (user?.isSuperAdmin) return true;
  if (isTreeOwner(tree, user) || isTreeCollaborator(tree, user)) return true;
  return (tree.visibility || 'public') === 'public';
}

/**
 * Edit rules:
 * - Unauthenticated public visitors can NEVER edit.
 * - Super Admin can edit EVERY tree.
 * - Owner and invited Collaborators can edit their tree.
 */
export function canEditTree(tree: FamilyTreeGroupRecord, user: AuthUser | null): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  return isTreeOwner(tree, user) || isTreeCollaborator(tree, user);
}

/**
 * Tree settings (visibility public/private & collaborator invites):
 * - Super Admin or the Tree Owner.
 */
export function canManageTreeSettings(
  tree: FamilyTreeGroupRecord,
  user: AuthUser | null
): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  return isTreeOwner(tree, user);
}

export function getTreeAccessBadge(
  tree: FamilyTreeGroupRecord,
  user: AuthUser | null
): 'owner' | 'collaborator' | 'super-admin' | 'read-only' {
  if (user?.isSuperAdmin && !isTreeOwner(tree, user)) return 'super-admin';
  if (isTreeOwner(tree, user)) return 'owner';
  if (isTreeCollaborator(tree, user)) return 'collaborator';
  return 'read-only';
}
