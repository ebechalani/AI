import { AI_LIMITS } from '@/lib/limits';
import type { SchoolStats } from '@/types/analytics';
import type { License } from '@/types/billing';
import type { IsoDateString, Locale } from '@/types/common';
import type { SchoolCounts, SchoolSettings } from '@/types/school';
import type { Session } from '@/types/user';

// The school admin's pure model: their school, the licences and seats, the dashboard's
// derived numbers and the settings forms' payloads. No React, so Vitest can import it.

function toTime(value: Date | IsoDateString): number {
  return value instanceof Date ? value.getTime() : Date.parse(value);
}

/** The admin's school id; a school admin without a school is corrupt data (error.tsx shows it). */
export function requireSchoolId(session: Pick<Session, 'schoolId'>): string {
  if (session.schoolId === null) throw new Error('A school admin without a school.');
  return session.schoolId;
}

// ---------------------------------------------------------------------------------------------
// Licences and seats

export type LicenseState = 'active' | 'upcoming' | 'expired' | 'suspended';

/** Suspended wins; then ended (now >= endsAt); then not started (now < startsAt); else active. */
export function licenseState(
  license: Pick<License, 'status' | 'startsAt' | 'endsAt'>,
  now: Date | IsoDateString,
): LicenseState {
  if (license.status === 'suspended') return 'suspended';
  const time = toTime(now);
  if (time >= Date.parse(license.endsAt)) return 'expired';
  if (time < Date.parse(license.startsAt)) return 'upcoming';
  return 'active';
}

/**
 * The rule of `data/analytics.getSchoolStats`: status 'active' and not ended. An upcoming licence
 * counts, so the dashboard and the licences page agree.
 */
export function countsTowardSeats(
  license: Pick<License, 'status' | 'endsAt'>,
  now: Date | IsoDateString,
): boolean {
  return license.status === 'active' && toTime(now) < Date.parse(license.endsAt);
}

export const LICENSE_EXPIRY_WARNING_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days until `iso`, rounded up; 0 or less once it has passed. */
export function daysUntil(iso: IsoDateString, now: Date | IsoDateString): number {
  return Math.ceil((Date.parse(iso) - toTime(now)) / DAY_MS);
}

/** An active licence that ends within LICENSE_EXPIRY_WARNING_DAYS. */
export function isExpiringSoon(
  license: Pick<License, 'status' | 'startsAt' | 'endsAt'>,
  now: Date | IsoDateString,
): boolean {
  return (
    licenseState(license, now) === 'active' &&
    daysUntil(license.endsAt, now) <= LICENSE_EXPIRY_WARNING_DAYS
  );
}

/** The active licence that ends last, or null. */
export function currentLicense(
  licenses: readonly License[],
  now: Date | IsoDateString,
): License | null {
  let current: License | null = null;
  for (const license of licenses) {
    if (licenseState(license, now) !== 'active') continue;
    if (current === null || Date.parse(license.endsAt) > Date.parse(current.endsAt)) {
      current = license;
    }
  }
  return current;
}

export interface SeatSummary {
  used: number;
  total: number;
  /** total > 0 and used > total: counted, never enforced (ARCHITECTURE.md 4.5). */
  over: boolean;
  /** total === 0: no licence counts. */
  noLicense: boolean;
  /** round(used / total × 100) clamped to 0–100; 0 without a licence. */
  percent: number;
}

export function seatSummary(used: number, total: number): SeatSummary {
  const noLicense = total <= 0;
  return {
    used,
    total,
    over: !noLicense && used > total,
    noLicense,
    percent: noLicense ? 0 : Math.min(100, Math.max(0, Math.round((used / total) * 100))),
  };
}

/** `seatSummary` with the seats of the licences that count (`countsTowardSeats`). */
export function seatSummaryFromLicenses(
  seatsUsed: number,
  licenses: readonly License[],
  now: Date | IsoDateString,
): SeatSummary {
  const total = licenses
    .filter((license) => countsTowardSeats(license, now))
    .reduce((sum, license) => sum + license.seatsTotal, 0);
  return seatSummary(seatsUsed, total);
}

// ---------------------------------------------------------------------------------------------
// Dashboard

/** null when there is no enrollment: the dashboard shows "—" and a hint instead of "0%". */
export function completionRate(
  stats: Pick<SchoolStats, 'enrollments' | 'completionRatePercent'>,
): number | null {
  return stats.enrollments === 0 ? null : stats.completionRatePercent;
}

export type OnboardingStep = 'teachers' | 'classes';

/** What a new school still has to do, in order: add teachers, then create a class. */
export function onboardingSteps(
  counts: Pick<SchoolCounts, 'teachers' | 'classes'>,
): OnboardingStep[] {
  const steps: OnboardingStep[] = [];
  if (counts.teachers === 0) steps.push('teachers');
  if (counts.classes === 0) steps.push('classes');
  return steps;
}

/** How many certificates the dashboard's recent activity lists. */
export const RECENT_CERTIFICATES = 5;

// ---------------------------------------------------------------------------------------------
// Settings forms

export interface ProfileFormValues {
  name: string;
  city: string;
  defaultLocale: Locale;
}

/** A blank city is no city; the strings go to the schema untrimmed (it trims). */
export function profilePayload(values: ProfileFormValues): {
  name: string;
  city: string | null;
  defaultLocale: Locale;
} {
  return {
    name: values.name,
    city: values.city.trim() === '' ? null : values.city,
    defaultLocale: values.defaultLocale,
  };
}

export interface FeaturesFormValues {
  aiEnabled: boolean;
  /** As typed: '' is the RoboHolic default. */
  aiDailyMessageLimit: string;
  joinCodesEnabled: boolean;
}

/**
 * The whole `settings` object (`updateSchool` replaces it as a whole). An empty limit is null,
 * never 0; anything else is a number for the schema to judge (NaN, 2.5, 0 and 500 fail there).
 */
export function featuresPayload(values: FeaturesFormValues): { settings: SchoolSettings } {
  const limit = values.aiDailyMessageLimit.trim();
  return {
    settings: {
      aiEnabled: values.aiEnabled,
      aiDailyMessageLimit: limit === '' ? null : Number(limit),
      joinCodesEnabled: values.joinCodesEnabled,
    },
  };
}

export function featuresValues(settings: SchoolSettings): FeaturesFormValues {
  return {
    aiEnabled: settings.aiEnabled,
    aiDailyMessageLimit:
      settings.aiDailyMessageLimit === null ? '' : String(settings.aiDailyMessageLimit),
    joinCodesEnabled: settings.joinCodesEnabled,
  };
}

/** The tutor's daily limit a pupil of the school gets when the school sets none. */
export const DEFAULT_DAILY_MESSAGES = AI_LIMITS.tutor.student.perDay;

/** The country's name in `locale`; the code itself when `Intl` refuses it. */
export function regionName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}
