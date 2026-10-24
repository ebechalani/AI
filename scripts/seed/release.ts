// Content releases (ARCHITECTURE.md 11.7): official content added after a database was first
// seeded, written into that database without changing what it already holds. A release names
// new courses, new modules of courses the database holds, and course details to replace. Every
// document it creates is the one courseWrites would write, with the seed's ids and derived
// fields, and is recorded in meta/contentReleases by the transaction that creates it: a run
// that stopped half-way resumes where it stopped, and a document an admin deleted afterwards
// is never created again. The seed, which writes the content of every release with the rest,
// records each release the same way (recordSeededReleases). On documents that exist, a release
// rewrites only what the repositories keep consistent around a new module or course (module
// `order`, the course's moduleCount and lessonCount, the pathway's publishedCourseCount), and
// course details only while they are still the ones it replaces.
//
// The pure half (checks, paths, decisions, placement) is exported for
// tests/unit/content-release.test.ts; runReleases reads and writes Firestore. This module must
// never import scripts/seed/index.ts, which runs the seed as soon as it is imported.

import {
  FieldValue,
  type DocumentReference,
  type DocumentSnapshot,
  type Transaction,
} from 'firebase-admin/firestore';
import { listPublishedCoursesByPathway } from '@/lib/data/courses';
import { getPublishedPathway } from '@/lib/data/pathways';
import { getAdminDb } from '@/lib/firebase/admin';
import { collections } from '@/lib/firebase/collections';
import { createdNow, fromSnapshot, serverTimestamp, updatedNow } from '@/lib/firebase/converters';
import { CONTENT_LIMITS } from '@/lib/limits';
import { ID_PATTERN } from '@/lib/schemas/common';
import type { Course } from '@/types/content';
import { ScriptError } from '../lib/admin';
import type { DocumentWrite } from '../lib/firestore';
import { courseDetailsOf, fingerprintCourseDetails } from './course-details';
import { courseWrites, seedCourseDetails } from './course-writes';
import type { ContentRelease, SeedCourse, SeedModule } from './types';

/** `meta/contentReleases`: per release, when a run first finished it and what it wrote. */
export function contentReleasesDoc(): DocumentReference {
  return collections.meta().doc('contentReleases');
}

// The owner a new official course gets when the database holds no official course of the
// seed to take it from: what the seed gives every course on a real project.
const SYSTEM_OWNER = 'system';

const READ_CHUNK = 300;
// Below the 500 writes of a transaction, with room for the record of what the chunk created.
const WRITE_CHUNK = 400;
const TRANSACTION_WRITES = 500;

const FINGERPRINT_PATTERN = /^[0-9a-f]{16}$/;

function chunks<T>(items: readonly T[], size: number): T[][] {
  const result: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    result.push(items.slice(start, start + size));
  }
  return result;
}

function seedCourse(courses: readonly SeedCourse[], courseId: string): SeedCourse {
  const course = courses.find((candidate) => candidate.id === courseId);
  if (course === undefined) throw new ScriptError(`${courseId} is not a course of SEED_COURSES.`);
  return course;
}

function seedModule(course: SeedCourse, moduleId: string): SeedModule {
  const found = course.modules.find((candidate) => candidate.id === moduleId);
  if (found === undefined) throw new ScriptError(`${course.id} has no module ${moduleId}.`);
  return found;
}

// --- Checks ------------------------------------------------------------------------------------

/** The quizzes and projects the blocks of a module reference, by id. */
function moduleLinks(courseModule: SeedModule): { quizzes: Set<string>; projects: Set<string> } {
  const links = { quizzes: new Set<string>(), projects: new Set<string>() };
  for (const lesson of courseModule.lessons) {
    for (const block of lesson.blocks) {
      if (block.type === 'quiz') links.quizzes.add(block.data.quizId);
      if (block.type === 'project') links.projects.add(block.data.projectId);
    }
  }
  return links;
}

// A new module brings its quizzes and projects with it, so no other module may point at them:
// a database that lacks the module lacks them too.
function sharedLinkProblems(path: string, course: SeedCourse, moduleId: string): string[] {
  const own = moduleLinks(seedModule(course, moduleId));
  const problems: string[] = [];
  for (const other of course.modules) {
    if (other.id === moduleId) continue;
    const theirs = moduleLinks(other);
    for (const quizId of own.quizzes) {
      if (theirs.quizzes.has(quizId)) {
        problems.push(`${path}: quiz ${quizId} is also referenced from module ${other.id}`);
      }
    }
    for (const projectId of own.projects) {
      if (theirs.projects.has(projectId)) {
        problems.push(`${path}: project ${projectId} is also referenced from module ${other.id}`);
      }
    }
  }
  return problems;
}

/**
 * What is wrong with a list of releases, one line each: ids that do not match ID_PATTERN or
 * are used twice, content that SEED_COURSES does not hold, a course or a module named twice,
 * a new module whose quizzes or projects another module references, a malformed fingerprint.
 */
export function releaseProblems(
  releases: readonly ContentRelease[],
  courses: readonly SeedCourse[],
): string[] {
  const problems: string[] = [];
  const byId = new Map(courses.map((course) => [course.id, course]));
  const releaseIds = new Set<string>();
  const newCourses = new Map<string, string>();
  const newModules = new Map<string, string>();
  const details = new Map<string, string>();

  for (const release of releases) {
    const path = `release ${release.id}`;
    if (typeof release.id !== 'string' || !ID_PATTERN.test(release.id)) {
      problems.push(`${path}: id does not match ${ID_PATTERN}`);
    } else if (releaseIds.has(release.id)) {
      problems.push(`${path}: id is used twice`);
    }
    releaseIds.add(release.id);
    if (release.summary.trim() === '') problems.push(`${path}: summary is blank`);
    const items =
      release.newCourses.length + release.newModules.length + release.courseDetails.length;
    if (items === 0) problems.push(`${path}: names no content`);

    for (const courseId of release.newCourses) {
      const at = `${path} / new course ${courseId}`;
      if (!byId.has(courseId)) problems.push(`${at}: not in SEED_COURSES`);
      const earlier = newCourses.get(courseId);
      if (earlier !== undefined) problems.push(`${at}: already named by release ${earlier}`);
      newCourses.set(courseId, release.id);
    }

    for (const { courseId, moduleId } of release.newModules) {
      const key = `${courseId}/${moduleId}`;
      const at = `${path} / new module ${key}`;
      const course = byId.get(courseId);
      if (course === undefined) {
        problems.push(`${at}: course ${courseId} is not in SEED_COURSES`);
      } else if (!course.modules.some((candidate) => candidate.id === moduleId)) {
        problems.push(`${at}: not in SEED_COURSES`);
      } else {
        problems.push(...sharedLinkProblems(at, course, moduleId));
      }
      const earlier = newModules.get(key);
      if (earlier !== undefined) problems.push(`${at}: already named by release ${earlier}`);
      newModules.set(key, release.id);
    }

    for (const { courseId, before } of release.courseDetails) {
      const at = `${path} / details of ${courseId}`;
      if (!byId.has(courseId)) problems.push(`${at}: course ${courseId} is not in SEED_COURSES`);
      if (typeof before !== 'string' || !FINGERPRINT_PATTERN.test(before)) {
        problems.push(`${at}: before "${String(before)}" is not 16 lowercase hex digits`);
      }
      // A later release may replace the same course's details again, from what an earlier one
      // left; the same starting point named twice is a mistake.
      const key = `${courseId}/${before}`;
      const earlier = details.get(key);
      if (earlier !== undefined) problems.push(`${at}: already named by release ${earlier}`);
      details.set(key, release.id);
    }
  }
  return problems;
}

/** Every new course's pathway must be published, as the seed requires of its own. */
export async function pathwayProblems(
  releases: readonly ContentRelease[],
  courses: readonly SeedCourse[],
): Promise<string[]> {
  const problems: string[] = [];
  const pathwayIds = new Set(
    releases.flatMap((release) =>
      release.newCourses.map((courseId) => seedCourse(courses, courseId).course.pathwayId),
    ),
  );
  for (const pathwayId of pathwayIds) {
    if ((await getPublishedPathway(pathwayId)) === null) {
      problems.push(
        `pathways/${pathwayId} does not exist or is not published: run "npm run migrate" first.`,
      );
    }
  }
  return problems;
}

/** The releases a command line names, oldest first; none named means every release. */
export function selectReleases(
  releases: readonly ContentRelease[],
  ids: readonly string[],
): ContentRelease[] {
  const unknown = ids.filter((id) => !releases.some((release) => release.id === id));
  if (unknown.length > 0) {
    const known = releases.map((release) => release.id).join(', ') || 'none';
    throw new ScriptError(`Unknown release ${unknown.join(', ')} (known: ${known}).`);
  }
  return ids.length === 0 ? [...releases] : releases.filter((release) => ids.includes(release.id));
}

// --- Documents ---------------------------------------------------------------------------------

/**
 * The paths of the documents a module brings: the module, its lessons with their blocks, and
 * the quizzes (with their answer key) and projects those blocks reference.
 */
export function modulePaths(course: SeedCourse, moduleId: string): string[] {
  const courseModule = seedModule(course, moduleId);
  const base = `courses/${course.id}`;
  const paths = [`${base}/modules/${courseModule.id}`];
  for (const lesson of courseModule.lessons) {
    paths.push(`${base}/lessons/${lesson.id}`);
    for (const block of lesson.blocks) {
      paths.push(`${base}/lessons/${lesson.id}/blocks/${block.id}`);
    }
  }
  const links = moduleLinks(courseModule);
  for (const quizId of links.quizzes) {
    paths.push(`${base}/quizzes/${quizId}`, `${base}/quizzes/${quizId}/private/key`);
  }
  for (const projectId of links.projects) paths.push(`${base}/projects/${projectId}`);
  return paths;
}

/** The writes courseWrites makes for those documents, in its order, with the same fields. */
export function moduleWrites(course: SeedCourse, moduleId: string): DocumentWrite[] {
  const paths = new Set(modulePaths(course, moduleId));
  // The owner is a field of the course document only, which is not among them.
  const writes = courseWrites(course, SYSTEM_OWNER).filter((write) => paths.has(write.ref.path));
  const written = new Set(writes.map((write) => write.ref.path));
  const missing = [...paths].filter((path) => !written.has(path));
  if (missing.length > 0) {
    throw new ScriptError(`courseWrites writes no ${missing.join(', ')}.`);
  }
  return writes;
}

function fieldsOf(write: DocumentWrite) {
  return typeof write.fields === 'function' ? write.fields(null) : write.fields;
}

// --- Decisions ---------------------------------------------------------------------------------

export interface Skip {
  action: 'skip';
  reason: string;
  /** Something a person has to look at, as opposed to work already done. */
  warning: boolean;
}

export type CreateDecision = { action: 'create'; paths: string[] } | Skip;
export type DetailsDecision = { action: 'update' } | Skip;

/** Which of the paths a decision looks at exist, and which the release recorded as created. */
export interface DocumentsState {
  existing: ReadonlySet<string>;
  recorded: ReadonlySet<string>;
}

function skip(reason: string, warning = false): Skip {
  return { action: 'skip', reason, warning };
}

const CREATED = 'created by this release';
const DELETED = 'created by this release and deleted since: not created again';

function listed(paths: readonly string[]): string {
  const shown = paths.slice(0, 5).join(', ');
  return paths.length > 5 ? `${shown} and ${paths.length - 5} more` : shown;
}

/**
 * A new course is written whole when the database neither holds it nor ever got it from this
 * release. A run that stopped half-way left some documents recorded: only the others remain.
 * `paths` are courseWrites' paths, the course document last.
 */
export function decideNewCourse(
  courseId: string,
  paths: readonly string[],
  state: DocumentsState,
): CreateDecision {
  const coursePath = `courses/${courseId}`;
  if (state.existing.has(coursePath)) {
    return skip(state.recorded.has(coursePath) ? CREATED : 'already in the database');
  }
  if (state.recorded.has(coursePath)) return skip(DELETED);
  const foreign = paths.filter((path) => state.existing.has(path) && !state.recorded.has(path));
  if (foreign.length > 0) {
    return skip(
      `not created: documents with its ids exist already and are left as they are (${listed(foreign)})`,
      true,
    );
  }
  return { action: 'create', paths: paths.filter((path) => !state.recorded.has(path)) };
}

/**
 * A new module is created, with everything it brings, in a course the database holds, when
 * the database neither holds the module nor ever got it from this release. It is created in
 * one transaction, so its documents are all there or none is.
 */
export function decideNewModule(
  courseId: string,
  moduleId: string,
  paths: readonly string[],
  state: DocumentsState & { courseExists: boolean },
): CreateDecision {
  const modulePath = `courses/${courseId}/modules/${moduleId}`;
  if (!state.courseExists) return skip(`courses/${courseId} is not in the database`, true);
  if (state.existing.has(modulePath)) {
    return skip(state.recorded.has(modulePath) ? CREATED : 'already in the database');
  }
  if (state.recorded.has(modulePath)) return skip(DELETED);
  const foreign = paths.filter((path) => state.existing.has(path));
  if (foreign.length > 0) {
    return skip(
      `not created: documents with its ids exist already and are left as they are (${listed(foreign)})`,
      true,
    );
  }
  return { action: 'create', paths: [...paths] };
}

/**
 * Details are replaced only while the database holds the ones the release replaces. `later`
 * are the `before` fingerprints of later releases for the same course: details that one of
 * them replaces are an official version too, left to that release.
 */
export function decideCourseDetails(state: {
  /** fingerprintCourseDetails of the stored course; null when the course is not there. */
  live: string | null;
  before: string;
  /** The fingerprint of the details SEED_COURSES holds. */
  seed: string;
  later: readonly string[];
  /** This release replaced them before. */
  recorded: boolean;
}): DetailsDecision {
  if (state.live === null) return skip('the course is not in the database', true);
  if (state.live === state.seed) return skip('already up to date');
  if (state.recorded) {
    return skip('replaced by this release before and edited in the app since: left as they are');
  }
  if (state.live === state.before) return { action: 'update' };
  if (state.later.includes(state.live)) return skip('a later release replaces them');
  return skip(
    'edited in the app: left as they are; make the change by hand in the course editor',
    true,
  );
}

// --- Placement ---------------------------------------------------------------------------------

export interface Placement {
  /** The new module's `order`. */
  order: number;
  /** The id of the module it follows; null when it comes first. */
  after: string | null;
  /** Existing modules whose `order` changes, and to what. */
  moves: { id: string; order: number }[];
}

/**
 * Where a new module goes among the modules a database holds: after the nearest module that
 * precedes it in the course file and is there, else first. The modules are numbered 0..n-1
 * again, as reorderModules numbers them; only those whose `order` changes are listed.
 */
export function placeModule(
  fileOrder: readonly string[],
  moduleId: string,
  stored: readonly { id: string; order: number }[],
): Placement {
  // Firestore's orderBy('order') breaks ties by document id.
  const current = [...stored].sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : 1));
  const index = fileOrder.indexOf(moduleId);
  let position = 0;
  let after: string | null = null;
  for (let previous = index - 1; previous >= 0; previous -= 1) {
    const at = current.findIndex((entry) => entry.id === fileOrder[previous]);
    if (at !== -1) {
      position = at + 1;
      after = current[at]!.id;
      break;
    }
  }
  const ids = current.map((entry) => entry.id);
  ids.splice(position, 0, moduleId);
  const moves = current.flatMap((entry) => {
    const order = ids.indexOf(entry.id);
    return order === entry.order ? [] : [{ id: entry.id, order }];
  });
  return { order: position, after, moves };
}

// --- Records -----------------------------------------------------------------------------------

interface Recorded {
  applied: boolean;
  created: Set<string>;
  updated: Set<string>;
}

function recordedOf(snapshot: DocumentSnapshot, releaseId: string): Recorded {
  const releases: unknown = snapshot.exists ? snapshot.get('releases') : undefined;
  const entry: unknown =
    typeof releases === 'object' && releases !== null && Object.hasOwn(releases, releaseId)
      ? (releases as Record<string, unknown>)[releaseId]
      : undefined;
  const field = (name: string): unknown =>
    typeof entry === 'object' && entry !== null ? (entry as Record<string, unknown>)[name] : null;
  const paths = (name: string) => {
    const value = field(name);
    return new Set(Array.isArray(value) ? value.filter((path) => typeof path === 'string') : []);
  };
  const appliedAt = field('appliedAt');
  return {
    applied: appliedAt !== null && appliedAt !== undefined,
    created: paths('created'),
    updated: paths('updated'),
  };
}

/** Adds paths to what the release recorded, in the transaction that writes them. */
function record(
  tx: Transaction,
  releaseId: string,
  field: 'created' | 'updated',
  paths: readonly string[],
): void {
  if (paths.length === 0) return;
  tx.set(
    contentReleasesDoc(),
    {
      releases: { [releaseId]: { [field]: FieldValue.arrayUnion(...paths) } },
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

async function readAll(refs: readonly DocumentReference[]): Promise<DocumentSnapshot[]> {
  const snapshots: DocumentSnapshot[] = [];
  for (const chunk of chunks(refs, READ_CHUNK)) {
    snapshots.push(...(await getAdminDb().getAll(...chunk)));
  }
  return snapshots;
}

// --- Running -----------------------------------------------------------------------------------

export interface ReleaseReport {
  releaseId: string;
  /** Documents created, or that a dry run would create. */
  created: string[];
  /** Existing documents changed, or that a dry run would change, with what changes. */
  changed: string[];
  /** Items left alone, with the reason. */
  skipped: string[];
  /** Items left alone that a person has to look at. */
  warnings: string[];
}

export interface RunOptions {
  /** The seed content: SEED_COURSES outside the tests. */
  courses: readonly SeedCourse[];
  /** false for a dry run: the same reads and the same report, and nothing written. */
  apply: boolean;
  /** Where the report lines go; console.log and console.warn by default. */
  log?: (line: string, level: 'info' | 'warn') => void;
  /**
   * Every release, oldest first, when only some of them run (CONTENT_RELEASES): the `before`
   * of a later one keeps an earlier one from warning about details that it replaces. By
   * default, the releases that run.
   */
  all?: readonly ContentRelease[];
}

interface Run extends Required<RunOptions> {
  ownerUid: string;
  /** Courses this run creates, or would create in a dry run: their modules come with them. */
  newCourses: Set<string>;
  /**
   * What the modules a dry run planned would change in their course (module orders, lessons
   * added), for the next module of the same course to be planned against: a dry run writes
   * nothing, so the database cannot tell it.
   */
  planned: Map<string, { orders: Map<string, number>; lessons: number }>;
}

function defaultLog(line: string, level: 'info' | 'warn'): void {
  if (level === 'warn') console.warn(line);
  else console.log(line);
}

interface Reporter {
  report: ReleaseReport;
  item(line: string): void;
  created(path: string): void;
  changed(path: string, what: string): void;
  skipped(subject: string, decision: Skip): void;
}

function reporter(releaseId: string, log: Run['log']): Reporter {
  const report: ReleaseReport = { releaseId, created: [], changed: [], skipped: [], warnings: [] };
  return {
    report,
    item: (line) => log(`   ${line}`, 'info'),
    created: (path) => {
      report.created.push(path);
      log(`     + ${path}`, 'info');
    },
    changed: (path, what) => {
      report.changed.push(`${path}: ${what}`);
      log(`     ~ ${path}: ${what}`, 'info');
    },
    skipped: (subject, decision) => {
      const line = `${subject}: ${decision.reason}`;
      if (decision.warning) {
        report.warnings.push(line);
        log(`   WARNING: ${line}`, 'warn');
      } else {
        report.skipped.push(line);
        log(`   ${line}`, 'info');
      }
    },
  };
}

/**
 * The owner the seed gave the official courses the database holds (the demo platform admin
 * on the emulators, 'system' on a real project), so that a new course matches them.
 */
async function officialOwnerUid(courses: readonly SeedCourse[]): Promise<string> {
  const snapshots = await readAll(courses.map((course) => collections.courses().doc(course.id)));
  for (const snapshot of snapshots) {
    const owner: unknown = snapshot.get('ownerUid');
    if (snapshot.get('isOfficial') === true && typeof owner === 'string' && owner !== '') {
      return owner;
    }
  }
  return SYSTEM_OWNER;
}

async function releaseCourse(
  run: Run,
  release: ContentRelease,
  courseId: string,
  out: Reporter,
): Promise<void> {
  const writes = courseWrites(seedCourse(run.courses, courseId), run.ownerUid);
  const [recordSnapshot, ...snapshots] = await readAll([
    contentReleasesDoc(),
    ...writes.map((write) => write.ref),
  ]);
  const decision = decideNewCourse(
    courseId,
    writes.map((write) => write.ref.path),
    {
      existing: new Set(snapshots.filter((snapshot) => snapshot.exists).map((s) => s.ref.path)),
      recorded: recordedOf(recordSnapshot!, release.id).created,
    },
  );
  if (decision.action === 'skip') {
    out.skipped(`courses/${courseId}`, decision);
    return;
  }

  run.newCourses.add(courseId);
  const remaining = decision.paths.length < writes.length ? ' (the rest of a stopped run)' : '';
  out.item(`courses/${courseId}: new course, ${decision.paths.length} documents${remaining}`);
  for (const path of decision.paths) out.created(path);
  if (!run.apply) return;

  // The course document comes last, so the course appears only once everything else is there.
  const todo = new Set(decision.paths);
  for (const chunk of chunks(
    writes.filter((write) => todo.has(write.ref.path)),
    WRITE_CHUNK,
  )) {
    await getAdminDb().runTransaction(async (tx) => {
      const [current, ...existing] = await tx.getAll(
        contentReleasesDoc(),
        ...chunk.map((write) => write.ref),
      );
      const recorded = recordedOf(current!, release.id).created;
      const created: string[] = [];
      chunk.forEach((write, index) => {
        if (recorded.has(write.ref.path)) return;
        if (existing[index]!.exists) {
          throw new ScriptError(`${write.ref.path} appeared during the run; run it again.`);
        }
        tx.create(write.ref, { ...fieldsOf(write), ...createdNow() });
        created.push(write.ref.path);
      });
      record(tx, release.id, 'created', created);
    });
  }
}

/** What setCourseStatus maintains for a course published through the repository (3.6). */
async function recountPathways(run: Run, release: ContentRelease, out: Reporter): Promise<void> {
  const [current, ...courses] = await readAll([
    contentReleasesDoc(),
    ...release.newCourses.map((courseId) => collections.courses().doc(courseId)),
  ]);
  const recorded = recordedOf(current!, release.id).created;
  const pathwayIds = new Set<string>();
  release.newCourses.forEach((courseId, index) => {
    // Only for the courses this release created and the database still holds, in this run or
    // in one that stopped before it got here; a dry run counts those it would create.
    const ours = run.apply
      ? recorded.has(`courses/${courseId}`) && courses[index]!.exists
      : run.newCourses.has(courseId);
    if (ours) pathwayIds.add(seedCourse(run.courses, courseId).course.pathwayId);
  });
  for (const pathwayId of pathwayIds) {
    const ref = collections.pathways().doc(pathwayId);
    if (!run.apply) {
      out.changed(ref.path, 'publishedCourseCount counted again');
      continue;
    }
    const count = (await listPublishedCoursesByPathway(pathwayId)).length;
    const previous = await getAdminDb().runTransaction(async (tx) => {
      const pathway = await tx.get(ref);
      const stored: unknown = pathway.get('publishedCourseCount');
      if (!pathway.exists || stored === count) return null;
      tx.update(ref, { publishedCourseCount: count, ...updatedNow() });
      return stored;
    });
    if (previous !== null) {
      out.changed(ref.path, `publishedCourseCount ${String(previous)} → ${count}`);
    }
  }
}

async function releaseModule(
  run: Run,
  release: ContentRelease,
  { courseId, moduleId }: { courseId: string; moduleId: string },
  out: Reporter,
): Promise<void> {
  const course = seedCourse(run.courses, courseId);
  const writes = moduleWrites(course, moduleId);
  const paths = writes.map((write) => write.ref.path);
  const subject = `courses/${courseId}/modules/${moduleId}`;
  const courseRef = collections.courses().doc(courseId);

  type Outcome =
    | { decision: Skip }
    | {
        decision: { action: 'create'; paths: string[] };
        placement: Placement;
        counts: { modules: [number, number]; lessons: [number, number] };
      };
  // Decided inside the transaction, which may run its function more than once; reported after.
  const outcome = await getAdminDb().runTransaction<Outcome>(
    async (tx) => {
      const [courseSnapshot, current, ...existing] = await tx.getAll(
        courseRef,
        contentReleasesDoc(),
        ...writes.map((write) => write.ref),
      );
      if (!courseSnapshot!.exists && run.newCourses.has(courseId)) {
        return { decision: skip('written with its course') };
      }
      const decision = decideNewModule(courseId, moduleId, paths, {
        courseExists: courseSnapshot!.exists,
        existing: new Set(existing.filter((s) => s.exists).map((s) => s.ref.path)),
        recorded: recordedOf(current!, release.id).created,
      });
      if (decision.action === 'skip') return { decision };

      const plan = run.planned.get(courseId);
      const stored = (await tx.get(collections.modules(courseId))).docs.map((document) => ({
        id: document.id,
        order: plan?.orders.get(document.id) ?? Number(document.get('order')),
      }));
      const modules = [
        ...stored,
        ...[...(plan?.orders ?? [])]
          .filter(([id]) => !stored.some((entry) => entry.id === id))
          .map(([id, order]) => ({ id, order })),
      ];
      if (modules.length >= CONTENT_LIMITS.modulesPerCourse) {
        return {
          decision: skip(`courses/${courseId} has the most modules a course can hold`, true),
        };
      }
      const lessonCount = (await tx.get(collections.lessons(courseId))).size + (plan?.lessons ?? 0);
      const placement = placeModule(
        course.modules.map((candidate) => candidate.id),
        moduleId,
        modules,
      );
      const newLessons = seedModule(course, moduleId).lessons.length;
      const counts = {
        modules: [modules.length, modules.length + 1] as [number, number],
        lessons: [lessonCount, lessonCount + newLessons] as [number, number],
      };
      if (!run.apply) return { decision, placement, counts };

      if (writes.length + placement.moves.length + 2 > TRANSACTION_WRITES) {
        throw new ScriptError(`${subject} has too many documents for one transaction.`);
      }
      for (const write of writes) {
        const placed = write.ref.path === subject ? { order: placement.order } : {};
        tx.create(write.ref, { ...fieldsOf(write), ...placed, ...createdNow() });
      }
      for (const move of placement.moves) {
        tx.update(collections.modules(courseId).doc(move.id), {
          order: move.order,
          ...updatedNow(),
        });
      }
      tx.update(courseRef, {
        moduleCount: counts.modules[1],
        lessonCount: counts.lessons[1],
        ...updatedNow(),
      });
      record(tx, release.id, 'created', paths);
      return { decision, placement, counts };
    },
    run.apply ? undefined : { readOnly: true },
  );

  if (!('placement' in outcome)) {
    out.skipped(subject, outcome.decision);
    return;
  }
  const { decision, placement, counts } = outcome;
  if (!run.apply) {
    const plan = run.planned.get(courseId) ?? { orders: new Map<string, number>(), lessons: 0 };
    plan.orders.set(moduleId, placement.order);
    for (const move of placement.moves) plan.orders.set(move.id, move.order);
    plan.lessons += counts.lessons[1] - counts.lessons[0];
    run.planned.set(courseId, plan);
  }
  const where = placement.after === null ? 'first' : `after ${placement.after}`;
  out.item(`${subject}: new module, ${decision.paths.length} documents, placed ${where}`);
  for (const path of decision.paths) out.created(path);
  for (const move of placement.moves) {
    out.changed(`courses/${courseId}/modules/${move.id}`, `order → ${move.order}`);
  }
  out.changed(
    courseRef.path,
    `moduleCount ${counts.modules[0]} → ${counts.modules[1]}, lessonCount ${counts.lessons[0]} → ${counts.lessons[1]}`,
  );
}

async function releaseDetails(
  run: Run,
  release: ContentRelease,
  { courseId, before }: { courseId: string; before: string },
  out: Reporter,
): Promise<void> {
  const details = seedCourseDetails(seedCourse(run.courses, courseId));
  const seed = fingerprintCourseDetails(details);
  const position = run.all.findIndex((candidate) => candidate.id === release.id);
  const later = run.all
    .slice(position + 1)
    .flatMap((next) => next.courseDetails)
    .filter((item) => item.courseId === courseId)
    .map((item) => item.before);
  const ref = collections.courses().doc(courseId);

  const decision = await getAdminDb().runTransaction<DetailsDecision>(
    async (tx) => {
      const [course, current] = await tx.getAll(ref, contentReleasesDoc());
      if (!course!.exists && run.newCourses.has(courseId)) return skip('written with its course');
      const choice = decideCourseDetails({
        live: course!.exists
          ? fingerprintCourseDetails(courseDetailsOf(fromSnapshot<Course>(course!)))
          : null,
        before,
        seed,
        later,
        recorded: recordedOf(current!, release.id).updated.has(ref.path),
      });
      if (choice.action === 'update' && run.apply) {
        tx.update(ref, {
          translations: details.translations,
          estimatedMinutes: details.estimatedMinutes,
          tags: details.tags,
          ...updatedNow(),
        });
        record(tx, release.id, 'updated', [ref.path]);
      }
      return choice;
    },
    run.apply ? undefined : { readOnly: true },
  );

  if (decision.action === 'skip') out.skipped(`${ref.path} details`, decision);
  else out.changed(ref.path, 'translations, estimatedMinutes and tags from SEED_COURSES');
}

/**
 * Records every release as applied, with what it creates and replaces, once the seed has
 * written SEED_COURSES whole: the seed writes the content of every release with the rest, so a
 * database it seeded holds that content exactly as a run of the release would have left it.
 * Without the record, a module or a course an admin deleted afterwards would look new to the
 * release and be created again, and course details an admin edited would look like details the
 * release never replaced. An empty list writes nothing.
 */
export async function recordSeededReleases(
  releases: readonly ContentRelease[],
  courses: readonly SeedCourse[],
): Promise<void> {
  if (releases.length === 0) return;
  await getAdminDb().runTransaction(async (tx) => {
    const current = await tx.get(contentReleasesDoc());
    const entries: Record<string, Record<string, unknown>> = {};
    for (const release of releases) {
      const created = [
        ...release.newCourses.flatMap((courseId) =>
          courseWrites(seedCourse(courses, courseId), SYSTEM_OWNER).map((write) => write.ref.path),
        ),
        ...release.newModules.flatMap(({ courseId, moduleId }) =>
          modulePaths(seedCourse(courses, courseId), moduleId),
        ),
      ];
      const updated = release.courseDetails.map(({ courseId }) => `courses/${courseId}`);
      const entry: Record<string, unknown> = {};
      if (created.length > 0) entry.created = FieldValue.arrayUnion(...created);
      if (updated.length > 0) entry.updated = FieldValue.arrayUnion(...updated);
      if (!recordedOf(current, release.id).applied) entry.appliedAt = serverTimestamp();
      // An empty map would replace what the release recorded before, so none is written.
      if (Object.keys(entry).length > 0) entries[release.id] = entry;
    }
    if (Object.keys(entries).length === 0) return;
    tx.set(
      contentReleasesDoc(),
      { releases: entries, updatedAt: serverTimestamp() },
      { merge: true },
    );
  });
}

/** appliedAt is written once, by the first run that finishes the release. */
async function markApplied(run: Run, release: ContentRelease, out: Reporter): Promise<void> {
  if (!run.apply) {
    const recorded = recordedOf(await contentReleasesDoc().get(), release.id);
    if (!recorded.applied) out.item('the release would be recorded as applied');
    return;
  }
  const marked = await getAdminDb().runTransaction(async (tx) => {
    if (recordedOf(await tx.get(contentReleasesDoc()), release.id).applied) return false;
    tx.set(
      contentReleasesDoc(),
      {
        releases: { [release.id]: { appliedAt: serverTimestamp() } },
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return true;
  });
  if (marked) out.item(`recorded as applied in ${contentReleasesDoc().path}`);
}

/**
 * Runs the releases in the order given (oldest first) against the database the process is
 * connected to: for each one its new courses, then its new modules, then its course details.
 * Run validateSeedContent, releaseProblems and pathwayProblems first.
 */
export async function runReleases(
  releases: readonly ContentRelease[],
  options: RunOptions,
): Promise<ReleaseReport[]> {
  const run: Run = {
    ...options,
    log: options.log ?? defaultLog,
    all: options.all ?? releases,
    ownerUid: await officialOwnerUid(options.courses),
    newCourses: new Set(),
    planned: new Map(),
  };
  const reports: ReleaseReport[] = [];
  for (const release of releases) {
    run.log(`\n== Release ${release.id}: ${release.summary}`, 'info');
    const out = reporter(release.id, run.log);
    for (const courseId of release.newCourses) await releaseCourse(run, release, courseId, out);
    await recountPathways(run, release, out);
    for (const item of release.newModules) await releaseModule(run, release, item, out);
    for (const item of release.courseDetails) await releaseDetails(run, release, item, out);
    await markApplied(run, release, out);
    reports.push(out.report);
  }
  return reports;
}
