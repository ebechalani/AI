import 'server-only';
import type { Actor } from '@/lib/auth/actor';
import { assertCan, isPlatformAdmin } from '@/lib/auth/authz';
import { collections } from '@/lib/firebase/collections';
import { fromQuery, fromSnapshotOrNull } from '@/lib/firebase/converters';
import type { Pathway } from '@/types/content';
import { isId } from './internal-identity';

// Pathways are reference data: written only by migration scripts in the MVP.

/** Anonymous catalog read, in display order. Callers filter by `audience` in memory. */
export async function listPublishedPathways(): Promise<Pathway[]> {
  const snapshot = await collections
    .pathways()
    .where('status', '==', 'published')
    .orderBy('order')
    .get();
  return fromQuery<Pathway>(snapshot);
}

/** Anonymous catalog read; null for an unknown or unpublished pathway. */
export async function getPublishedPathway(pathwayId: string): Promise<Pathway | null> {
  if (!isId(pathwayId)) return null;
  const pathway = fromSnapshotOrNull<Pathway>(await collections.pathways().doc(pathwayId).get());
  return pathway?.status === 'published' ? pathway : null;
}

/** Drafts included, in display order: the pathway select of the official course editor. */
export async function listPathways(actor: Actor): Promise<Pathway[]> {
  assertCan(isPlatformAdmin(actor), 'pathways.list');
  const snapshot = await collections.pathways().get();
  return fromQuery<Pathway>(snapshot).sort((a, b) => a.order - b.order);
}
