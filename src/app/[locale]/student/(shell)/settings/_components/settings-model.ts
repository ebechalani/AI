import type { Locale } from '@/types/common';
import type { ProfilePatch } from '@/types/inputs';
import type { UserProfile } from '@/types/user';

// The Settings forms as plain data (ARCHITECTURE.md 6.4 "Settings").

export interface ProfileDraft {
  displayName: string;
  avatarId: string;
}

/** Only what changed: displayName compared trimmed; an unchanged form gives {}. */
export function profilePatch(saved: ProfileDraft, draft: ProfileDraft): ProfilePatch {
  const patch: ProfilePatch = {};
  if (draft.displayName.trim() !== saved.displayName.trim()) patch.displayName = draft.displayName;
  if (draft.avatarId !== saved.avatarId) patch.avatarId = draft.avatarId;
  return patch;
}

export function isEmptyPatch(patch: ProfilePatch): boolean {
  return (
    patch.displayName === undefined && patch.locale === undefined && patch.avatarId === undefined
  );
}

/** What saving the language does: persist when it differs from the stored one; switch when it differs from the page's. */
export function languagePlan(
  selected: Locale,
  stored: Locale,
  page: Locale,
): { persist: boolean; switchTo: Locale | null } {
  return { persist: selected !== stored, switchTo: selected !== page ? selected : null };
}

/** How the user signs in: a username (provisioned pupils) or an email; null when neither is known. */
export function accountIdentifier(
  profile: Pick<UserProfile, 'username' | 'email'>,
): { kind: 'username' | 'email'; value: string } | null {
  if (profile.username) return { kind: 'username', value: profile.username };
  if (profile.email) return { kind: 'email', value: profile.email };
  return null;
}
