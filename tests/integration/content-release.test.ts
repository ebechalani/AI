import { beforeAll, describe, expect, it } from 'vitest';
import {
  deleteLesson,
  deleteModule,
  updateCourse,
  updateLesson,
  updateModule,
} from '@/lib/data/courses';
import { deleteProject } from '@/lib/data/projects';
import { deleteQuiz } from '@/lib/data/quizzes';
import { getAdminDb } from '@/lib/firebase/admin';
import { collections } from '@/lib/firebase/collections';
import type { Session } from '@/types';
import { deleteTree } from '../../scripts/lib/firestore';
import { SEED_COURSES } from '../../scripts/seed/content';
import {
  courseDetailsOf,
  fingerprintCourseDetails,
  type CourseDetails,
} from '../../scripts/seed/course-details';
import { seedCourseDetails } from '../../scripts/seed/course-writes';
import {
  contentReleasesDoc,
  modulePaths,
  recordSeededReleases,
  runReleases,
  type ReleaseReport,
} from '../../scripts/seed/release';
import type { ContentRelease, SeedCourse } from '../../scripts/seed/types';
import { resetEmulators, runScript, seedEmulators } from './support/emulators';
import { DEMO_UID, sessionFor } from './support/world';

// The content release tool of ARCHITECTURE.md 11.7 over the seeded world. The seed writes
// today's content; a database seeded before a release is simulated by taking out what the
// release adds (a whole course, two modules of another) and by giving a course the details it
// had before. Applying the release must then leave every document as the seed writes it, keep
// what an admin edited in the app, change nothing when it runs again, and never bring back
// what an admin deleted afterwards, also where the seed wrote the release's content itself.

function seedCourse(courseId: string): SeedCourse {
  const course = SEED_COURSES.find((candidate) => candidate.id === courseId);
  if (course === undefined) throw new Error(`${courseId} is not seeded`);
  return course;
}

/** Comes back whole: not assigned to the demo class, so no learner is enrolled in it. */
const NEW_COURSE = seedCourse('ai-robotics-foundations');
/** Gets its first and its last module back, which moves the ones in between. */
const GROWN = seedCourse('from-ai-user-to-ai-developer');
const FIRST = GROWN.modules[0]!;
const LAST = GROWN.modules.at(-1)!;
const KEPT = GROWN.modules.slice(1, -1);
/** Holds older details, which the release replaces. */
const OLDER = seedCourse('build-with-generative-ai');
/** Holds details a platform admin edited in the app, which the release keeps. */
const EDITED = seedCourse('my-first-ai-adventure');
/** Holds the seed's details already. */
const CURRENT = seedCourse('ai-essentials-for-educators');

function retitled(details: CourseDetails, suffix: string): CourseDetails {
  const translations = structuredClone(details.translations);
  for (const entry of Object.values(translations)) {
    if (entry) entry.title = `${entry.title} ${suffix}`;
  }
  return { translations, estimatedMinutes: details.estimatedMinutes + 30, tags: [suffix] };
}

const OLDER_DETAILS = retitled(seedCourseDetails(OLDER), 'v1');

const RELEASE: ContentRelease = {
  id: 'integration-release',
  summary: 'What a database seeded before this release lacks',
  newCourses: [NEW_COURSE.id],
  newModules: [
    { courseId: GROWN.id, moduleId: LAST.id },
    { courseId: GROWN.id, moduleId: FIRST.id },
  ],
  courseDetails: [
    { courseId: OLDER.id, before: fingerprintCourseDetails(OLDER_DETAILS) },
    {
      courseId: EDITED.id,
      before: fingerprintCourseDetails(retitled(seedCourseDetails(EDITED), 'v1')),
    },
    {
      courseId: CURRENT.id,
      before: fingerprintCourseDetails(retitled(seedCourseDetails(CURRENT), 'v1')),
    },
  ],
};

// --- Reading the database ----------------------------------------------------------------------

// firebase-admin is imported under src/lib and scripts only (eslint); its types come from there.
type DocumentReference = ReturnType<ReturnType<typeof collections.courses>['doc']>;
type DocumentSnapshot = Awaited<ReturnType<DocumentReference['get']>>;
type DocumentData = Record<string, unknown>;
type Tree = Map<string, DocumentSnapshot>;

const CLOCK = ['createdAt', 'updatedAt', 'publishedAt'];

function isTimestamp(value: unknown): boolean {
  return typeof value === 'object' && value !== null && 'toMillis' in value;
}

/** A document and everything below it, by path. */
async function readTree(ref: DocumentReference, tree: Tree = new Map()): Promise<Tree> {
  const snapshot = await ref.get();
  if (snapshot.exists) tree.set(ref.path, snapshot);
  for (const collection of await ref.listCollections()) {
    for (const child of await collection.listDocuments()) await readTree(child, tree);
  }
  return tree;
}

const courseTree = (courseId: string) => readTree(collections.courses().doc(courseId));

/** The stored fields without the clock: what two writes of the same content share. */
function contentOf(tree: Tree): Record<string, DocumentData> {
  return Object.fromEntries(
    [...tree].map(([path, snapshot]) => [
      path,
      Object.fromEntries(
        Object.entries(snapshot.data()!).filter(([field]) => !CLOCK.includes(field)),
      ),
    ]),
  );
}

/** When each document a release could touch was last written: equal times, no write. */
async function writeTimes(): Promise<Record<string, string>> {
  const refs = [
    ...SEED_COURSES.map((course) => collections.courses().doc(course.id)),
    ...(await collections.pathways().listDocuments()),
    contentReleasesDoc(),
  ];
  const times: Record<string, string> = {};
  for (const ref of refs) {
    for (const [path, snapshot] of await readTree(ref))
      times[path] = snapshot.updateTime!.valueOf();
  }
  return times;
}

async function storedDetails(courseId: string): Promise<CourseDetails> {
  const data = (await collections.courses().doc(courseId).get()).data() as CourseDetails;
  return courseDetailsOf(data);
}

// --- An older database -------------------------------------------------------------------------

/** Takes a module out with what it brings, as if the database had never had it. */
async function removeModule(course: SeedCourse, moduleId: string): Promise<void> {
  const db = getAdminDb();
  for (const path of modulePaths(course, moduleId)) await deleteTree(db.doc(path));
}

/** The counters and positions a database without those modules holds. */
async function renumber(courseId: string): Promise<void> {
  const modules = await collections.modules(courseId).orderBy('order').get();
  const lessons = await collections.lessons(courseId).get();
  const batch = getAdminDb().batch();
  modules.docs.forEach((document, order) => batch.update(document.ref, { order }));
  batch.update(collections.courses().doc(courseId), {
    moduleCount: modules.size,
    lessonCount: lessons.size,
  });
  await batch.commit();
}

const quiet = (lines: string[]) => (line: string) => {
  lines.push(line);
};

describe('content releases over a database seeded before them', () => {
  let admin: Session;
  /** Each course as the seed writes it. */
  const seeded = new Map<string, Tree>();
  let pathwayCount: unknown;
  let editedDetails: CourseDetails;
  let editedLesson: DocumentData;
  let editedModule: DocumentData;
  let firstApply: ReleaseReport;

  beforeAll(async () => {
    await resetEmulators();
    seedEmulators();
    admin = await sessionFor(DEMO_UID.admin);
    for (const course of [NEW_COURSE, GROWN, OLDER])
      seeded.set(course.id, await courseTree(course.id));
    const pathway = collections.pathways().doc(NEW_COURSE.course.pathwayId);
    pathwayCount = (await pathway.get()).get('publishedCourseCount');

    // The older database: no robotics course, two modules fewer, the details of before.
    await deleteTree(collections.courses().doc(NEW_COURSE.id));
    await pathway.update({ publishedCourseCount: 0 });
    await removeModule(GROWN, FIRST.id);
    await removeModule(GROWN, LAST.id);
    await renumber(GROWN.id);
    await collections
      .courses()
      .doc(OLDER.id)
      .update({ ...OLDER_DETAILS });

    // What a platform admin changed in the app since.
    const edited = await updateCourse(admin, EDITED.id, {
      tags: ['edited-in-the-app'],
      estimatedMinutes: 95,
    });
    editedDetails = courseDetailsOf(edited);
    const lesson = KEPT[0]!.lessons[0]!;
    const lessonTranslations = structuredClone(lesson.input.translations);
    lessonTranslations.en!.title = 'A title an admin wrote';
    await updateLesson(admin, GROWN.id, lesson.id, {
      defaultLocale: lesson.input.defaultLocale,
      translations: lessonTranslations,
    });
    editedLesson = (await collections.lessons(GROWN.id).doc(lesson.id).get()).data()!;
    const moduleTranslations = structuredClone(KEPT[0]!.input.translations);
    moduleTranslations.en!.title = 'A module title an admin wrote';
    await updateModule(admin, GROWN.id, KEPT[0]!.id, {
      defaultLocale: KEPT[0]!.input.defaultLocale,
      translations: moduleTranslations,
    });
    editedModule = (await collections.modules(GROWN.id).doc(KEPT[0]!.id).get()).data()!;
  }, 240_000);

  it('a dry run reports what the release would write, and writes nothing', async () => {
    const before = await writeTimes();
    const [report] = await runReleases([RELEASE], {
      courses: SEED_COURSES,
      apply: false,
      log: quiet([]),
    });

    expect(await writeTimes()).toEqual(before);
    const lacking = [
      ...seeded.get(NEW_COURSE.id)!.keys(),
      ...modulePaths(GROWN, LAST.id),
      ...modulePaths(GROWN, FIRST.id),
    ];
    expect([...report!.created].sort()).toEqual([...lacking].sort());
    // Planned one after the other, as the run would write them: the last module after the ones
    // kept, then the first module before everything, which moves the others down by one.
    const lessons = (modules: typeof GROWN.modules) =>
      modules.reduce((sum, courseModule) => sum + courseModule.lessons.length, 0);
    expect(report!.changed).toEqual(
      expect.arrayContaining([
        `courses/${GROWN.id}: moduleCount ${KEPT.length} → ${KEPT.length + 1}, lessonCount ${lessons(KEPT)} → ${lessons([...KEPT, LAST])}`,
        ...[...KEPT, LAST].map(
          (courseModule, order) =>
            `courses/${GROWN.id}/modules/${courseModule.id}: order → ${order + 1}`,
        ),
        `courses/${GROWN.id}: moduleCount ${KEPT.length + 1} → ${GROWN.modules.length}, lessonCount ${lessons([...KEPT, LAST])} → ${lessons(GROWN.modules)}`,
      ]),
    );
    expect(report!.changed).toContain(
      `courses/${OLDER.id}: translations, estimatedMinutes and tags from SEED_COURSES`,
    );
    expect(report!.changed).toContain(
      `pathways/${NEW_COURSE.course.pathwayId}: publishedCourseCount counted again`,
    );
    expect(report!.warnings).toEqual([
      `courses/${EDITED.id} details: edited in the app: left as they are; make the change by hand in the course editor`,
    ]);
    // The seed records the releases it already holds; this one is not among them.
    const recorded: unknown = (await contentReleasesDoc().get()).get('releases');
    expect(Object.keys((recorded ?? {}) as object)).not.toContain(RELEASE.id);
  });

  it('applying it writes every document the release adds exactly as the seed writes it', async () => {
    [firstApply] = (await runReleases([RELEASE], {
      courses: SEED_COURSES,
      apply: true,
      log: quiet([]),
    })) as [ReleaseReport];

    // The new course: every document, with the seed's ids and derived fields, and its pathway.
    const course = await courseTree(NEW_COURSE.id);
    expect(contentOf(course)).toEqual(contentOf(seeded.get(NEW_COURSE.id)!));
    expect(course.get(`courses/${NEW_COURSE.id}`)?.get('publishedAt')).toSatisfy(isTimestamp);
    const pathway = collections.pathways().doc(NEW_COURSE.course.pathwayId);
    expect((await pathway.get()).get('publishedCourseCount')).toBe(pathwayCount);

    // The grown course: modules back in place, counters recounted, quiz keys and project links
    // there; the admin's edits are the only difference from what the seed wrote.
    const expected = contentOf(seeded.get(GROWN.id)!);
    const lessonPath = `courses/${GROWN.id}/lessons/${KEPT[0]!.lessons[0]!.id}`;
    const modulePath = `courses/${GROWN.id}/modules/${KEPT[0]!.id}`;
    expected[lessonPath] = { ...expected[lessonPath], translations: editedLesson.translations };
    expected[modulePath] = { ...expected[modulePath], translations: editedModule.translations };
    expect(contentOf(await courseTree(GROWN.id))).toEqual(expected);
    // Its order changed, so it was written; nothing but `order` differs from the admin's version.
    const moved = (await collections.modules(GROWN.id).doc(KEPT[0]!.id).get()).data()!;
    expect(moved).toEqual({ ...editedModule, order: 1, updatedAt: moved.updatedAt });

    // Details: replaced where they were the older ones, kept where an admin edited them.
    expect(fingerprintCourseDetails(await storedDetails(OLDER.id))).toBe(
      fingerprintCourseDetails(seedCourseDetails(OLDER)),
    );
    expect(contentOf(await readTree(collections.courses().doc(OLDER.id)))).toEqual(
      contentOf(seeded.get(OLDER.id)!),
    );
    expect(await storedDetails(EDITED.id)).toEqual(editedDetails);
    expect(firstApply.skipped).toContain(`courses/${CURRENT.id} details: already up to date`);
    expect(firstApply.warnings).toHaveLength(1);

    // What the release created and replaced is recorded under its id.
    const record = (await contentReleasesDoc().get()).get(`releases`)[RELEASE.id];
    expect([...record.created].sort()).toEqual([...firstApply.created].sort());
    expect(record.updated).toEqual([`courses/${OLDER.id}`]);
    expect(record.appliedAt).toSatisfy(isTimestamp);
  });

  it('applying it again changes nothing', async () => {
    const before = await writeTimes();
    const [report] = await runReleases([RELEASE], {
      courses: SEED_COURSES,
      apply: true,
      log: quiet([]),
    });

    expect(await writeTimes()).toEqual(before);
    expect(report!.created).toEqual([]);
    expect(report!.changed).toEqual([]);
    expect(report!.skipped).toEqual([
      `courses/${NEW_COURSE.id}: created by this release`,
      `courses/${GROWN.id}/modules/${LAST.id}: created by this release`,
      `courses/${GROWN.id}/modules/${FIRST.id}: created by this release`,
      `courses/${OLDER.id} details: already up to date`,
      `courses/${CURRENT.id} details: already up to date`,
    ]);
    expect(report!.warnings).toEqual(firstApply.warnings);
  });

  it('never brings back a module or a course an admin deleted after the release', async () => {
    for (const lesson of LAST.lessons) await deleteLesson(admin, GROWN.id, lesson.id);
    await deleteModule(admin, GROWN.id, LAST.id);
    await deleteTree(collections.courses().doc(NEW_COURSE.id));
    const before = await writeTimes();

    const [report] = await runReleases([RELEASE], {
      courses: SEED_COURSES,
      apply: true,
      log: quiet([]),
    });

    expect(await writeTimes()).toEqual(before);
    expect((await collections.modules(GROWN.id).doc(LAST.id).get()).exists).toBe(false);
    expect((await collections.courses().doc(NEW_COURSE.id).get()).exists).toBe(false);
    expect(report!.created).toEqual([]);
    expect(report!.skipped).toContain(
      `courses/${NEW_COURSE.id}: created by this release and deleted since: not created again`,
    );
    expect(report!.skipped).toContain(
      `courses/${GROWN.id}/modules/${LAST.id}: created by this release and deleted since: not created again`,
    );
  });

  it('npm run content:release is a dry run unless --apply is given', async () => {
    const before = await writeTimes();
    const output = runScript('scripts/content-release.ts');
    expect(output).toContain('nothing was written');
    expect(await writeTimes()).toEqual(before);
  });

  it('never brings back what an admin deleted from a database the seed wrote a release into', async () => {
    // A database seeded at a commit that already holds a release: the seed wrote its module and
    // its details with the rest, then recorded it as it records every release of CONTENT_RELEASES.
    const courseModule = KEPT[0]!;
    const seededRelease: ContentRelease = {
      id: 'seeded-release',
      summary: 'Content the seed wrote with the rest',
      newCourses: [],
      newModules: [{ courseId: GROWN.id, moduleId: courseModule.id }],
      courseDetails: [
        {
          courseId: EDITED.id,
          before: fingerprintCourseDetails(retitled(seedCourseDetails(EDITED), 'v0')),
        },
      ],
    };
    await recordSeededReleases([seededRelease], SEED_COURSES);
    const record = (await contentReleasesDoc().get()).get('releases')[seededRelease.id];
    expect([...record.created].sort()).toEqual(modulePaths(GROWN, courseModule.id).sort());
    expect(record.updated).toEqual([`courses/${EDITED.id}`]);
    expect(record.appliedAt).toSatisfy(isTimestamp);
    const run = () =>
      runReleases([seededRelease], { courses: SEED_COURSES, apply: true, log: quiet([]) });

    // The module is there and an admin edited the details since: nothing to do, and no warning.
    let before = await writeTimes();
    const [untouched] = await run();
    expect(await writeTimes()).toEqual(before);
    expect(untouched!.skipped).toEqual([
      `courses/${GROWN.id}/modules/${courseModule.id}: created by this release`,
      `courses/${EDITED.id} details: replaced by this release before and edited in the app since: left as they are`,
    ]);
    expect(untouched!.warnings).toEqual([]);

    // An admin deletes the module in the app: its lessons, the quizzes and projects they freed,
    // then the module itself.
    const blocks = courseModule.lessons.flatMap((lesson) => lesson.blocks);
    for (const lesson of courseModule.lessons) await deleteLesson(admin, GROWN.id, lesson.id);
    for (const block of blocks) {
      if (block.type === 'quiz') await deleteQuiz(admin, GROWN.id, block.data.quizId);
      if (block.type === 'project') await deleteProject(admin, GROWN.id, block.data.projectId);
    }
    await deleteModule(admin, GROWN.id, courseModule.id);
    before = await writeTimes();

    const [report] = await run();
    expect(await writeTimes()).toEqual(before);
    expect((await collections.modules(GROWN.id).doc(courseModule.id).get()).exists).toBe(false);
    expect(report!.created).toEqual([]);
    expect(report!.skipped).toContain(
      `courses/${GROWN.id}/modules/${courseModule.id}: created by this release and deleted since: not created again`,
    );
  });
});
