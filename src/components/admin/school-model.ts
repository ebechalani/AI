import type { License } from '@/types/billing';
import type { IsoDateString, Locale } from '@/types/common';
import type { SchoolInput, SchoolPatch } from '@/types/inputs';
import type { School, SchoolSettings } from '@/types/school';
import { numberInput } from './field-errors';

// The school forms, the school pickers, the licence state and the seat summary as pure
// functions, shared by the components, the pages and the unit tests.

export interface SchoolFormValues {
  name: string;
  country: string;
  city: string;
  defaultLocale: Locale;
}

export const EMPTY_SCHOOL: SchoolFormValues = { name: '', country: '', city: '', defaultLocale: 'en' };

export function schoolValues(
  school: Pick<School, 'name' | 'country' | 'city' | 'defaultLocale'>,
): SchoolFormValues {
  return {
    name: school.name,
    country: school.country,
    city: school.city ?? '',
    defaultLocale: school.defaultLocale,
  };
}

/** City blank after trim → null; the rest as typed (the schema trims and upper-cases). */
export function schoolPayload(values: SchoolFormValues): SchoolInput {
  return {
    name: values.name,
    country: values.country,
    city: values.city.trim() === '' ? null : values.city,
    defaultLocale: values.defaultLocale,
  };
}

export interface SettingsFormValues {
  aiEnabled: boolean;
  aiDailyMessageLimit: string;
  joinCodesEnabled: boolean;
}

export function settingsValues(settings: SchoolSettings): SettingsFormValues {
  return {
    aiEnabled: settings.aiEnabled,
    aiDailyMessageLimit:
      settings.aiDailyMessageLimit === null ? '' : String(settings.aiDailyMessageLimit),
    joinCodesEnabled: settings.joinCodesEnabled,
  };
}

/** '' (after trim) → null; otherwise numberInput(value) (NaN, 2.5, 0, 500 reach the schema and fail there). */
export function settingsPayload(values: SettingsFormValues): SchoolSettings {
  return {
    aiEnabled: values.aiEnabled,
    aiDailyMessageLimit:
      values.aiDailyMessageLimit.trim() === '' ? null : numberInput(values.aiDailyMessageLimit),
    joinCodesEnabled: values.joinCodesEnabled,
  };
}

/** The whole patch the edit dialog sends: profile fields + settings (replaced as a whole). */
export function schoolPatch(values: SchoolFormValues, settings: SettingsFormValues): SchoolPatch {
  return { ...schoolPayload(values), settings: settingsPayload(settings) };
}

const WELL_FORMED_COUNTRY = /^[A-Z]{2}$/;

/**
 * True for a well-formed code (two letters) that names no country: an unassigned code such as
 * `LE` (what "Lebanon" becomes in a two-letter field) or `ZZ` (unknown region). The schema checks
 * only the shape (src/lib/schemas/school.ts), so the school forms refuse these themselves. A
 * malformed value is false here: the schema reports it. An engine without `Intl.DisplayNames`
 * accepts every code rather than blocking the form.
 */
export function isUnknownCountry(code: string): boolean {
  const upper = code.trim().toUpperCase();
  if (!WELL_FORMED_COUNTRY.test(upper)) return false;
  if (upper === 'ZZ') return true;
  if (typeof Intl.DisplayNames !== 'function') return false;
  try {
    return new Intl.DisplayNames(['en'], { type: 'region', fallback: 'none' }).of(upper) === undefined;
  } catch {
    return false;
  }
}

/** The country's name in `locale`; the code itself when Intl refuses it or knows no name. */
export function regionName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code;
  } catch {
    // RangeError: a malformed code ('L1', 'Lebanon').
    return code;
  }
}

export interface SchoolChoice {
  id: string;
  name: string;
  suspended: boolean;
}

/** By name (localeCompare with the locale), for every school select. */
export function schoolChoices(schools: readonly School[], locale: string): SchoolChoice[] {
  return schools
    .map((school) => ({ id: school.id, name: school.name, suspended: school.status === 'suspended' }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

export function schoolNameIndex(schools: readonly School[]): Record<string, string> {
  const index: Record<string, string> = {};
  for (const school of schools) index[school.id] = school.name;
  return index;
}

export type LicenseState = 'active' | 'upcoming' | 'expired' | 'suspended';

const at = (now: Date | IsoDateString): number =>
  typeof now === 'string' ? Date.parse(now) : now.getTime();

/** suspended → 'suspended'; else now >= endsAt → 'expired'; else now < startsAt → 'upcoming'; else 'active'. */
export function licenseState(
  license: Pick<License, 'status' | 'startsAt' | 'endsAt'>,
  now: Date | IsoDateString,
): LicenseState {
  if (license.status === 'suspended') return 'suspended';
  const t = at(now);
  if (t >= Date.parse(license.endsAt)) return 'expired';
  if (t < Date.parse(license.startsAt)) return 'upcoming';
  return 'active';
}

/** data/analytics' rule: status 'active' and now < endsAt (an upcoming licence counts). */
export function countsTowardSeats(
  license: Pick<License, 'status' | 'endsAt'>,
  now: Date | IsoDateString,
): boolean {
  return license.status === 'active' && at(now) < Date.parse(license.endsAt);
}

export interface SeatSummary {
  used: number;
  total: number;
  over: boolean;
  noLicense: boolean;
  percent: number;
}

/** used = the school's active students; total = Σ seats of the licences that count; percent clamped 0–100. */
export function seatSummary(
  used: number,
  licenses: readonly License[],
  now: Date | IsoDateString,
): SeatSummary {
  const total = licenses
    .filter((license) => countsTowardSeats(license, now))
    .reduce((sum, license) => sum + license.seatsTotal, 0);
  const percent = total > 0 ? Math.min(100, Math.max(0, Math.round((used / total) * 100))) : 0;
  return { used, total, over: total > 0 && used > total, noLicense: total === 0, percent };
}
