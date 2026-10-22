import type { ChipTone } from '@/components/ui/tones';
import type {
  License,
  LicenseScope,
  LicenseStatus,
  Subscription,
  SubscriptionOwnerType,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@/types/billing';
import type { IsoDateString } from '@/types/common';
import type { LicenseInput, SubscriptionInput } from '@/types/inputs';
import { addYear, dateInputToIso, isoToDateInput } from './dates';
import { numberInput } from './field-errors';

// The subscription and licence forms as pure functions: which plans an owner may have, the form
// values of a record, the payload of a form, and the chips and warnings the tables and dialogs
// show. Shared with the unit tests.

export const USER_PLANS = [
  'individual_monthly',
  'individual_yearly',
  'course_purchase',
  'teacher_training',
] as const satisfies readonly SubscriptionPlan[];

/**
 * A school's subscription is a payment record only: getCourseAccess (ARCHITECTURE.md 4.5)
 * reads the user subscriptions and the school's licences, never a school's subscriptions, and a
 * licence cannot name single courses. A school-owned course_purchase or teacher_training record
 * would give nobody anything, so the form offers schools the yearly plan only.
 */
export const SCHOOL_PLANS = ['school_annual'] as const satisfies readonly SubscriptionPlan[];

/** The plans of an owner type, plus `current` when an edited record holds a plan outside that list. */
export function plansFor(
  ownerType: SubscriptionOwnerType,
  current?: SubscriptionPlan,
): readonly SubscriptionPlan[] {
  const plans: readonly SubscriptionPlan[] = ownerType === 'school' ? SCHOOL_PLANS : USER_PLANS;
  return current !== undefined && !plans.includes(current) ? [...plans, current] : plans;
}

export function isCourseScoped(plan: SubscriptionPlan): boolean {
  return plan === 'course_purchase' || plan === 'teacher_training';
}

export function isIndividual(plan: SubscriptionPlan): boolean {
  return plan === 'individual_monthly' || plan === 'individual_yearly';
}

export type OwnerChoice =
  | { kind: 'fixed'; ownerType: SubscriptionOwnerType; ownerId: string; name: string }
  /** Pick a school; user owners only come fixed (from the user's own list). */
  | { kind: 'school' };

export interface SubscriptionFormValues {
  ownerType: SubscriptionOwnerType;
  /** '' until a school is picked. */
  ownerId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  /** Date inputs ('YYYY-MM-DD'). */
  periodStart: string;
  periodEnd: string;
  courseIds: string[];
  notes: string;
}

/** plan = the owner type's first plan; active; today → a year from today; no courses. */
export function emptySubscription(owner: OwnerChoice, today: string): SubscriptionFormValues {
  const ownerType: SubscriptionOwnerType = owner.kind === 'fixed' ? owner.ownerType : 'school';
  return {
    ownerType,
    ownerId: owner.kind === 'fixed' ? owner.ownerId : '',
    plan: plansFor(ownerType)[0]!,
    status: 'active',
    periodStart: today,
    periodEnd: addYear(today),
    courseIds: [],
    notes: '',
  };
}

export function subscriptionValues(
  subscription: Subscription,
  timeZone: string,
): SubscriptionFormValues {
  return {
    ownerType: subscription.ownerType,
    ownerId: subscription.ownerId,
    plan: subscription.plan,
    status: subscription.status,
    periodStart: isoToDateInput(subscription.currentPeriodStart, timeZone),
    periodEnd: isoToDateInput(subscription.currentPeriodEnd, timeZone),
    courseIds: [...subscription.courseIds],
    notes: subscription.notes ?? '',
  };
}

/**
 * Dates through dateInputToIso (null → '', which the schema answers with invalid_date);
 * courseIds kept only for course-scoped plans, else []; notes blank after trim → null.
 */
export function subscriptionPayload(
  values: SubscriptionFormValues,
  timeZone: string,
): SubscriptionInput {
  return {
    ownerType: values.ownerType,
    ownerId: values.ownerId,
    plan: values.plan,
    status: values.status,
    currentPeriodStart: dateInputToIso(values.periodStart, timeZone) ?? '',
    currentPeriodEnd: dateInputToIso(values.periodEnd, timeZone) ?? '',
    courseIds: isCourseScoped(values.plan) ? [...values.courseIds] : [],
    notes: values.notes.trim() === '' ? null : values.notes.trim(),
  };
}

/** When the plan changes to one that is not course-scoped, the picked courses are dropped. */
export function withPlan(
  values: SubscriptionFormValues,
  plan: SubscriptionPlan,
): SubscriptionFormValues {
  return { ...values, plan, courseIds: isCourseScoped(plan) ? values.courseIds : [] };
}

const at = (now: Date | IsoDateString): number =>
  typeof now === 'string' ? Date.parse(now) : now.getTime();

/** status trialing|active and now >= currentPeriodEnd: it covers nothing any more (4.5). */
export function periodEnded(
  subscription: Pick<Subscription, 'status' | 'currentPeriodEnd'>,
  now: Date | IsoDateString,
): boolean {
  const gives = subscription.status === 'trialing' || subscription.status === 'active';
  return gives && at(now) >= Date.parse(subscription.currentPeriodEnd);
}

const SUBSCRIPTION_TONES: Record<SubscriptionStatus, ChipTone> = {
  trialing: 'accent',
  active: 'success',
  past_due: 'warning',
  canceled: 'neutral',
  expired: 'neutral',
};

export function subscriptionTone(status: SubscriptionStatus): ChipTone {
  return SUBSCRIPTION_TONES[status];
}

export type Coverage =
  | { kind: 'individual' }
  | { kind: 'school' }
  | { kind: 'courses'; courseIds: string[] };

/** ownerType 'school' → school whatever the plan (4.5); user: individual_* → individual; else the courses. */
export function subscriptionCoverage(
  subscription: Pick<Subscription, 'ownerType' | 'plan' | 'courseIds'>,
): Coverage {
  if (subscription.ownerType === 'school') return { kind: 'school' };
  if (isIndividual(subscription.plan)) return { kind: 'individual' };
  return { kind: 'courses', courseIds: [...subscription.courseIds] };
}

const GIVES_ACCESS: readonly SubscriptionStatus[] = ['trialing', 'active'];

/**
 * A user subscription that gave access (trialing, active) and would not any more (past_due,
 * canceled, expired): the dialog warns and its submit turns danger.
 */
export function endsSubscriptionAccess(
  previous: SubscriptionStatus | null,
  next: SubscriptionStatus,
  ownerType: SubscriptionOwnerType,
): boolean {
  if (ownerType !== 'user' || previous === null) return false;
  return GIVES_ACCESS.includes(previous) && !GIVES_ACCESS.includes(next);
}

export interface LicenseFormValues {
  schoolId: string;
  name: string;
  seatsTotal: string;
  scopeType: LicenseScope['type'];
  pathwayIds: string[];
  /** Date inputs. */
  startsOn: string;
  endsOn: string;
  status: LicenseStatus;
  /** '' = none. */
  subscriptionId: string;
}

/** name ''; seats ''; all official; today → a year from today; active; no subscription. */
export function emptyLicense(schoolId: string, today: string): LicenseFormValues {
  return {
    schoolId,
    name: '',
    seatsTotal: '',
    scopeType: 'all_official',
    pathwayIds: [],
    startsOn: today,
    endsOn: addYear(today),
    status: 'active',
    subscriptionId: '',
  };
}

export function licenseValues(license: License, timeZone: string): LicenseFormValues {
  return {
    schoolId: license.schoolId,
    name: license.name,
    seatsTotal: String(license.seatsTotal),
    scopeType: license.scope.type,
    pathwayIds: license.scope.type === 'pathways' ? [...license.scope.pathwayIds] : [],
    startsOn: isoToDateInput(license.startsAt, timeZone),
    endsOn: isoToDateInput(license.endsAt, timeZone),
    status: license.status,
    subscriptionId: license.subscriptionId ?? '',
  };
}

/** seatsTotal through numberInput ('' → NaN → invalid_number); scope by type; '' subscription → null. */
export function licensePayload(values: LicenseFormValues, timeZone: string): LicenseInput {
  return {
    schoolId: values.schoolId,
    subscriptionId: values.subscriptionId === '' ? null : values.subscriptionId,
    name: values.name,
    seatsTotal: numberInput(values.seatsTotal),
    scope:
      values.scopeType === 'pathways'
        ? { type: 'pathways', pathwayIds: [...values.pathwayIds] }
        : { type: 'all_official' },
    startsAt: dateInputToIso(values.startsOn, timeZone) ?? '',
    endsAt: dateInputToIso(values.endsOn, timeZone) ?? '',
    status: values.status,
  };
}

/** An edit that moves an active licence to suspended: the whole school loses that access. */
export function suspendsLicense(previous: LicenseStatus | null, next: LicenseStatus): boolean {
  return previous === 'active' && next === 'suspended';
}
