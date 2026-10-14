import type { IsoDateString, Timestamped } from './common';

export const SUBSCRIPTION_PLANS = [
  'individual_monthly',
  'individual_yearly',
  'school_annual',
  'course_purchase',
  'teacher_training',
] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

export const SUBSCRIPTION_STATUSES = [
  'trialing',
  'active',
  'past_due',
  'canceled',
  'expired',
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const SUBSCRIPTION_OWNER_TYPES = ['user', 'school'] as const;
export type SubscriptionOwnerType = (typeof SUBSCRIPTION_OWNER_TYPES)[number];

export interface Subscription extends Timestamped {
  id: string;
  ownerType: SubscriptionOwnerType;
  /** A uid or a school id, per `ownerType`. */
  ownerId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: IsoDateString;
  currentPeriodEnd: IsoDateString;
  /** For course_purchase and teacher_training; empty otherwise. */
  courseIds: string[];
  provider: 'manual' | 'stripe';
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  notes: string | null;
  createdByUid: string;
}

export type LicenseScope = { type: 'all_official' } | { type: 'pathways'; pathwayIds: string[] };

export const LICENSE_STATUSES = ['active', 'suspended'] as const;
export type LicenseStatus = (typeof LICENSE_STATUSES)[number];

export interface License extends Timestamped {
  id: string;
  schoolId: string;
  subscriptionId: string | null;
  name: string;
  /** Seats used is not stored here: it is the school's `counts.students`. */
  seatsTotal: number;
  scope: LicenseScope;
  startsAt: IsoDateString;
  /** A licence is expired once now >= endsAt; that is derived, not a status. */
  endsAt: IsoDateString;
  status: LicenseStatus;
  createdByUid: string;
}
