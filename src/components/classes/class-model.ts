import { studentAccountPolicy } from '@/lib/auth/account-policy';
import { CONTENT_LIMITS } from '@/lib/limits';
import { AGE_BANDS, type AgeBand, type IsoDateString } from '@/types/common';
import type { Course } from '@/types/content';
import type { Enrollment } from '@/types/learning';
import type { ClassAssignment, ClassMember, School, SchoolClass } from '@/types/school';

// The pure model of class management: the join code's state and how it is read out, how a
// student came into the class, what the add-students card may offer, the names typed into the
// add-students form, the credentials sheet, due dates and the facts of one enrollment. No React,
// so Vitest can import it.

/** How many quiz attempts the pupil page lists (ARCHITECTURE.md 3.7, WS-E-1). */
export const STUDENT_ATTEMPTS_LIMIT = 50;

function toTime(value: Date | IsoDateString): number {
  return value instanceof Date ? value.getTime() : Date.parse(value);
}

// ---------------------------------------------------------------------------------------------
// Join code

export type JoinCodeState =
  | { kind: 'open'; expiresAt: IsoDateString }
  | { kind: 'expired'; expiredAt: IsoDateString }
  | { kind: 'off' };

/**
 * `regenerateJoinCode` gives even a closed code a fresh expiry, so "closed" is decided by
 * `joinCodeEnabled` first. An expiry at `now` has passed (the service's own `<=`).
 */
export function joinCodeState(
  cls: Pick<SchoolClass, 'joinCodeEnabled' | 'joinCodeExpiresAt' | 'archived'>,
  now: Date | IsoDateString,
): JoinCodeState {
  if (cls.archived || !cls.joinCodeEnabled || cls.joinCodeExpiresAt === null) return { kind: 'off' };
  const expiresAt = cls.joinCodeExpiresAt;
  if (Date.parse(expiresAt) <= toTime(now)) return { kind: 'expired', expiredAt: expiresAt };
  return { kind: 'open', expiresAt };
}

/** Two halves for reading ('RBHDEM23' → 'RBHD' 'EM23'); copying always uses the raw code. */
export function joinCodeGroups(code: string): [string, string] {
  const middle = Math.ceil(code.length / 2);
  return [code.slice(0, middle), code.slice(middle)];
}

/** One character at a time, so a screen reader spells the code instead of reading a word. */
export function spokenCode(code: string): string {
  return [...code].join(' ');
}

// ---------------------------------------------------------------------------------------------
// Roster

export type JoinMethod = 'code' | 'you' | 'staff';

export function joinMethod(member: Pick<ClassMember, 'addedByUid'>, viewerUid: string): JoinMethod {
  if (member.addedByUid === null) return 'code';
  return member.addedByUid === viewerUid ? 'you' : 'staff';
}

export type RosterEmptyVariant = 'both' | 'codeOnly' | 'addOnly' | 'none' | 'archived';

/**
 * The empty roster never invites the teacher to share a code that cannot work, or to add
 * students who cannot be added. An archived class says so: that state does not pass.
 */
export function rosterEmptyVariant(input: {
  archived: boolean;
  creationBlocked: boolean;
  schoolJoinCodesOff: boolean;
}): RosterEmptyVariant {
  if (input.archived) return 'archived';
  if (input.creationBlocked) return input.schoolJoinCodesOff ? 'none' : 'codeOnly';
  return input.schoolJoinCodesOff ? 'addOnly' : 'both';
}

// ---------------------------------------------------------------------------------------------
// Account policy for the add-students card

export interface PolicyContext {
  schoolActive: boolean;
  ownerVerifiedEducator: boolean;
}

/**
 * A missing school document counts as inactive. A school-less class has exactly its owner as
 * teacher, so the viewer's own verification stands for the owner's (the service re-checks).
 */
export function policyContext(
  cls: Pick<SchoolClass, 'schoolId' | 'ownerUid'>,
  school: Pick<School, 'status'> | null,
  viewer: { uid: string; verifiedEducator: boolean },
): PolicyContext {
  if (cls.schoolId !== null) {
    return { schoolActive: school?.status === 'active', ownerVerifiedEducator: false };
  }
  return {
    schoolActive: false,
    ownerVerifiedEducator: cls.ownerUid === viewer.uid && viewer.verifiedEducator,
  };
}

export type AccountBlock = 'school_inactive' | 'educator_not_verified';

export interface AccountCreation {
  allowedBands: AgeBand[];
  defaultBand: AgeBand | null;
  blocked: AccountBlock | null;
}

export function accountCreation(
  cls: Pick<SchoolClass, 'schoolId' | 'ageBand'>,
  ctx: PolicyContext,
): AccountCreation {
  const allowedBands = AGE_BANDS.filter((band) => studentAccountPolicy(cls, ctx, band).allowed);
  const defaultBand = allowedBands.includes(cls.ageBand) ? cls.ageBand : (allowedBands[0] ?? null);
  let blocked: AccountBlock | null = null;
  if (allowedBands.length === 0) {
    // 'adult' is never refused for its age, so the reason is the school or the verification.
    const decision = studentAccountPolicy(cls, ctx, 'adult');
    blocked =
      !decision.allowed && decision.reason === 'school_inactive'
        ? 'school_inactive'
        : 'educator_not_verified';
  }
  return { allowedBands, defaultBand, blocked };
}

export type JoinHint = 'anyAge' | 'thirteenPlus' | 'existingOnly';

/** Who can create an account with the code: the answer `lookupJoinCode` gives a visitor. */
export function joinHint(creation: AccountCreation): JoinHint {
  if (creation.allowedBands.includes('8-10')) return 'anyAge';
  return creation.allowedBands.length > 0 ? 'thirteenPlus' : 'existingOnly';
}

export function capacityLeft(cls: Pick<SchoolClass, 'studentCount'>): number {
  return Math.max(0, CONTENT_LIMITS.studentsPerClass - cls.studentCount);
}

// ---------------------------------------------------------------------------------------------
// Add-students form

/** One name per line, inner whitespace collapsed; blank lines dropped; duplicates kept. */
export function parseStudentNames(text: string): string[] {
  return text
    .split(/\r\n|\r|\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line !== '');
}

const STUDENT_LINE = /^students\.(\d+)(?:\.|$)/;

/** The schema's field errors, by line of the parsed names (1-based) and for the form. */
export function studentLineErrors(fieldErrors: Record<string, string[]>): {
  form: string[];
  lines: { line: number; keys: string[] }[];
} {
  const form = new Set<string>();
  const lines = new Map<number, Set<string>>();
  for (const [path, keys] of Object.entries(fieldErrors)) {
    const match = STUDENT_LINE.exec(path);
    if (match === null) {
      for (const key of keys) form.add(key);
      continue;
    }
    const line = Number(match[1]) + 1;
    const set = lines.get(line) ?? new Set<string>();
    for (const key of keys) set.add(key);
    lines.set(line, set);
  }
  return {
    form: [...form],
    lines: [...lines.entries()]
      .sort(([a], [b]) => a - b)
      .map(([line, keys]) => ({ line, keys: [...keys] })),
  };
}

// ---------------------------------------------------------------------------------------------
// Credentials

/** Not `Credential`: lib.dom declares a global of that name (Credential Management API). */
export interface StudentCredential {
  displayName: string;
  username: string;
  password: string;
}

/** A header line, then one tab-separated line per student; pastes into a spreadsheet. */
export function credentialsText(
  rows: readonly StudentCredential[],
  header: { name: string; username: string; password: string },
): string {
  return [
    [header.name, header.username, header.password],
    ...rows.map((row) => [row.displayName, row.username, row.password]),
  ]
    .map((fields) => fields.join('\t'))
    .join('\n');
}

// ---------------------------------------------------------------------------------------------
// Due dates

const DATE_INPUT = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * An `<input type="date">` value to the stored ISO datetime: noon UTC, which is the same
 * calendar day everywhere from UTC−11 to UTC+11. '' → null (no due date); anything that is not
 * a real calendar date → undefined.
 */
export function dueDateToIso(value: string): IsoDateString | null | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const match = DATE_INPUT.exec(trimmed);
  if (match === null) return undefined;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }
  return `${trimmed}T12:00:00.000Z`;
}

/** The calendar day of `iso` in `timeZone` as 'YYYY-MM-DD'; '' for null or a bad value. */
export function isoToDateInput(iso: IsoDateString | null, timeZone: string | undefined): string {
  if (iso === null) return '';
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return '';
  // en-CA writes dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(time);
}

/** Past the due day in the viewer's zone; the due day itself is not overdue. */
export function isOverdue(
  dueAt: IsoDateString | null,
  now: Date | IsoDateString,
  timeZone: string | undefined,
): boolean {
  if (dueAt === null) return false;
  const today = isoToDateInput(new Date(toTime(now)).toISOString(), timeZone);
  const due = isoToDateInput(dueAt, timeZone);
  return due !== '' && today > due;
}

// ---------------------------------------------------------------------------------------------
// Progress

export interface EnrollmentFacts {
  quizzesAttempted: number;
  quizzesPassed: number;
  quizAveragePercent: number | null;
  projectsApproved: number;
  projectsPending: number;
  projectsReturned: number;
}

/** The formulas of the class report (data/analytics), so the pupil page and the report agree. */
export function enrollmentFacts(
  enrollment: Pick<Enrollment, 'quizSummary' | 'projectSummary'>,
): EnrollmentFacts {
  const quizzes = Object.values(enrollment.quizSummary ?? {});
  const projects = Object.values(enrollment.projectSummary ?? {});
  return {
    quizzesAttempted: quizzes.length,
    quizzesPassed: quizzes.filter((quiz) => quiz.passed).length,
    quizAveragePercent:
      quizzes.length === 0
        ? null
        : Math.round(quizzes.reduce((sum, quiz) => sum + quiz.bestPercent, 0) / quizzes.length),
    projectsApproved: projects.filter(
      (project) => project.latestStatus === 'approved' || project.latestStatus === 'ai_reviewed',
    ).length,
    projectsPending: projects.filter((project) => project.latestStatus === 'submitted').length,
    projectsReturned: projects.filter((project) => project.latestStatus === 'returned').length,
  };
}

export interface AssignedCourseRow {
  assignment: ClassAssignment;
  /** null: the course is hidden from the viewer or gone (`getCourses` dropped it). */
  course: Course | null;
}

/** Built from the assignments, so a course the viewer cannot read still has a row. */
export function assignedCourseRows(
  assignments: readonly ClassAssignment[],
  courses: readonly Course[],
): AssignedCourseRow[] {
  const byId = new Map(courses.map((course) => [course.id, course]));
  return assignments.map((assignment) => ({
    assignment,
    course: byId.get(assignment.courseId) ?? null,
  }));
}
