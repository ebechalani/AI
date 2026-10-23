import 'server-only';
import type { DocumentReference } from 'firebase-admin/firestore';
import type { Actor } from '@/lib/auth/actor';
import { assertCan, canManageSchool, isPlatformAdmin } from '@/lib/auth/authz';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { collections } from '@/lib/firebase/collections';
import {
  createdNow,
  fromQuery,
  fromSnapshot,
  toTimestamp,
  updatedNow,
} from '@/lib/firebase/converters';
import { licenseInputSchema, subscriptionInputSchema } from '@/lib/schemas/admin';
import { parseInput } from '@/lib/schemas/common';
import {
  SUBSCRIPTION_OWNER_TYPES,
  type License,
  type Subscription,
  type SubscriptionOwnerType,
} from '@/types/billing';
import type { Page, PageRequest } from '@/types/common';
import type { LicenseInput, SubscriptionInput } from '@/types/inputs';
import { actorUid, assertId, isActorUid, readPage, updateExisting } from './internal-identity';

// Licences and subscriptions are entered by hand by a platform admin in the MVP; this module
// is their only writer.

function licenseDoc(licenseId: string): DocumentReference {
  assertId(licenseId);
  return collections.licenses().doc(licenseId);
}

function subscriptionDoc(subscriptionId: string): DocumentReference {
  assertId(subscriptionId);
  return collections.subscriptions().doc(subscriptionId);
}

/**
 * Latest end date first, expired and suspended licences included. For the school's admin and
 * platform admins; services/access reads a learner's school licences as the system.
 */
export async function listLicensesForSchool(actor: Actor, schoolId: string): Promise<License[]> {
  assertCan(canManageSchool(actor, schoolId), 'school.licenses.list');
  assertId(schoolId);
  const snapshot = await collections
    .licenses()
    .where('schoolId', '==', schoolId)
    .orderBy('endsAt', 'desc')
    .get();
  return fromQuery<License>(snapshot);
}

export async function upsertLicense(
  actor: Actor,
  licenseId: string | null,
  input: LicenseInput,
): Promise<License> {
  assertCan(isPlatformAdmin(actor), 'license.upsert');
  const parsed = parseInput(licenseInputSchema, input);
  if (!parsed.success) throw new ValidationError('Invalid licence.', parsed.fieldErrors);
  const { startsAt, endsAt, ...fields } = parsed.data;
  const ref = licenseId === null ? collections.licenses().doc() : licenseDoc(licenseId);
  const school = await collections.schools().doc(fields.schoolId).get();
  if (!school.exists) throw new NotFoundError(`schools/${fields.schoolId} does not exist.`);

  const data = { ...fields, startsAt: toTimestamp(startsAt), endsAt: toTimestamp(endsAt) };
  if (licenseId === null) {
    await ref.create({ ...data, createdByUid: actorUid(actor), ...createdNow() });
  } else {
    await updateExisting(ref, { ...data, ...updatedNow() });
  }
  return fromSnapshot<License>(await ref.get());
}

/**
 * Every licence of every school, latest end date first (expired and suspended ones included):
 * the platform admin's licence list. Paged like `listSubscriptions`; the cursor is the last
 * licence id of the previous page. One field in one direction, so Firestore's automatic
 * single-field index serves it (3.8 has no row for it).
 */
export async function listAllLicenses(actor: Actor, page?: PageRequest): Promise<Page<License>> {
  assertCan(isPlatformAdmin(actor), 'licenses.list');
  const query = collections.licenses().orderBy('endsAt', 'desc');
  return readPage<License>(query, collections.licenses(), page, () => true);
}

/** Latest period end first. */
export async function listSubscriptions(
  actor: Actor,
  page?: PageRequest,
): Promise<Page<Subscription>> {
  assertCan(isPlatformAdmin(actor), 'subscriptions.list');
  const query = collections.subscriptions().orderBy('currentPeriodEnd', 'desc');
  return readPage<Subscription>(query, collections.subscriptions(), page, () => true);
}

/** A user sees their own subscriptions, a school admin those of the school. Latest period end first. */
export async function listSubscriptionsForOwner(
  actor: Actor,
  ownerType: 'user' | 'school',
  ownerId: string,
): Promise<Subscription[]> {
  if (!SUBSCRIPTION_OWNER_TYPES.includes(ownerType)) {
    throw new ValidationError('Unknown owner type.', { ownerType: ['invalid_choice'] });
  }
  const allowed: Record<SubscriptionOwnerType, boolean> = {
    user: isPlatformAdmin(actor) || isActorUid(actor, ownerId),
    school: canManageSchool(actor, ownerId),
  };
  assertCan(allowed[ownerType], 'subscriptions.list_for_owner');
  assertId(ownerId);
  const snapshot = await collections
    .subscriptions()
    .where('ownerType', '==', ownerType)
    .where('ownerId', '==', ownerId)
    .orderBy('currentPeriodEnd', 'desc')
    .get();
  return fromQuery<Subscription>(snapshot);
}

export async function upsertSubscription(
  actor: Actor,
  subscriptionId: string | null,
  input: SubscriptionInput,
): Promise<Subscription> {
  assertCan(isPlatformAdmin(actor), 'subscription.upsert');
  const parsed = parseInput(subscriptionInputSchema, input);
  if (!parsed.success) throw new ValidationError('Invalid subscription.', parsed.fieldErrors);
  const { currentPeriodStart, currentPeriodEnd, ...fields } = parsed.data;

  const data = {
    ...fields,
    currentPeriodStart: toTimestamp(currentPeriodStart),
    currentPeriodEnd: toTimestamp(currentPeriodEnd),
  };
  const ref =
    subscriptionId === null ? collections.subscriptions().doc() : subscriptionDoc(subscriptionId);
  if (subscriptionId === null) {
    await ref.create({
      ...data,
      provider: 'manual' satisfies Subscription['provider'],
      providerCustomerId: null,
      providerSubscriptionId: null,
      createdByUid: actorUid(actor),
      ...createdNow(),
    });
  } else {
    await updateExisting(ref, { ...data, ...updatedNow() });
  }
  return fromSnapshot<Subscription>(await ref.get());
}
