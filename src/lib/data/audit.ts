import 'server-only';
import { isSystem, type Actor } from '@/lib/auth/actor';
import { collections } from '@/lib/firebase/collections';
import { serverTimestamp } from '@/lib/firebase/converters';

export const AUDIT_ACTIONS = [
  'user.role_changed',
  'user.status_changed',
  'user.password_reset',
  'user.educator_verified',
  'submission.reviewed',
  'file.deleted',
  'certificate.issued',
  'certificate.revoked',
  'license.upserted',
  'subscription.upserted',
  'school.status_changed',
  'badge.awarded',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

type AuditMeta = Record<string, string | number | boolean | null>;

function cleanMeta(meta: AuditMeta | undefined): AuditMeta {
  const clean: AuditMeta = {};
  for (const [key, value] of Object.entries(meta ?? {})) {
    if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Appends one entry to the audit trail: who did what to which target. The actor is recorded
 * as given, so a service passes the person who asked, not the system, whenever there is one;
 * work the system does on its own is recorded as 'system'. Entries are never read by the
 * application (they are inspected in the Firebase console), updated or deleted.
 */
export async function writeAudit(
  actor: Actor,
  entry: {
    action: AuditAction;
    targetType: string;
    targetId: string;
    schoolId: string | null;
    meta?: AuditMeta;
  },
): Promise<void> {
  await collections.auditLogs().add({
    actorUid: isSystem(actor) ? 'system' : actor.uid,
    actorRole: isSystem(actor) ? 'system' : actor.role,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    schoolId: entry.schoolId,
    meta: cleanMeta(entry.meta),
    createdAt: serverTimestamp(),
  });
}
