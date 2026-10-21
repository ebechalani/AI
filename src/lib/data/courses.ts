import 'server-only';
import { FieldValue, type DocumentReference, type Transaction } from 'firebase-admin/firestore';
import type { z } from 'zod';
import { isSystem, type Actor } from '@/lib/auth/actor';
import {
  assertCan,
  assertRole,
  canEditCourse,
  canViewCourse,
  canViewSchool,
  hasRole,
  isPlatformAdmin,
} from '@/lib/auth/authz';
import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors';
import { getAdminDb } from '@/lib/firebase/admin';
import { collections, docIds } from '@/lib/firebase/collections';
import {
  createdNow,
  fromQuery,
  fromSnapshot,
  fromSnapshotOrNull,
  serverTimestamp,
  updatedNow,
} from '@/lib/firebase/converters';
import { getPublishProblems } from '@/lib/learning/publish-readiness';
import { CONTENT_LIMITS } from '@/lib/limits';
import { parseInput } from '@/lib/schemas/common';
import {
  courseInputSchema,
  createBlockInputSchema,
  createLessonInputSchema,
  createModuleInputSchema,
  updateBlockInputSchema,
  updateCourseInputSchema,
  updateLessonInputSchema,
  updateModuleInputSchema,
} from '@/lib/schemas/course';
import { LEARNING_AREAS, type LearningArea, type MediaRef } from '@/types/common';
import {
  COURSE_STATUSES,
  type Course,
  type CourseOutline,
  type CourseStatus,
  type CourseVisibility,
  type Lesson,
  type LessonBlock,
  type Module,
} from '@/types/content';
import type { BlockInput, CourseInput, LessonInput, ModuleInput } from '@/types/inputs';
import {
  blockFileIds,
  deriveLessonFields,
  linkedContent,
  toBlockFields,
  type BlockFields,
  type DerivableBlock,
} from './course-derive';
import { getCourseMediaFiles, toMediaRef } from './files';
import {
  assertId,
  assertNoEnrollments,
  assertSameIds,
  courseDoc,
  isId,
  isSelfOrAdmin,
  loadCourse,
  loadEditableCourse,
  loadViewableCourse,
  nextOrder,
  requireSession,
  updateExisting,
} from './internal-content';

// Courses and their structure: modules, lessons, blocks. Quizzes and projects are in their own
// modules; the reverse links `quizzes.lessonId` and `projects.lessonId` are written here, by
// the block transactions that own them (ARCHITECTURE.md 3.6).

function parsed<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = parseInput(schema, input);
  if (!result.success) throw new ValidationError('Invalid input.', result.fieldErrors);
  return result.data;
}

// --- Published catalog (no actor: anonymous reads of published official content) ----------------

function isPublishedOfficial(course: Course): boolean {
  return course.isOfficial && course.status === 'published';
}

export async function listPublishedCoursesByPathway(pathwayId: string): Promise<Course[]> {
  if (!isId(pathwayId)) return [];
  const snapshot = await collections
    .courses()
    .where('pathwayId', '==', pathwayId)
    .where('status', '==', 'published')
    .orderBy('order')
    .get();
  return fromQuery<Course>(snapshot).filter(isPublishedOfficial);
}

export async function listPublishedCoursesByArea(area: LearningArea): Promise<Course[]> {
  if (!LEARNING_AREAS.includes(area)) return [];
  const snapshot = await collections
    .courses()
    .where('area', '==', area)
    .where('status', '==', 'published')
    .where('isOfficial', '==', true)
    .orderBy('order')
    .get();
  return fromQuery<Course>(snapshot);
}

export async function getPublishedCourse(courseId: string): Promise<Course | null> {
  if (!isId(courseId)) return null;
  const course = fromSnapshotOrNull<Course>(await courseDoc(courseId).get());
  return course !== null && isPublishedOfficial(course) ? course : null;
}

// --- Courses: reads ----------------------------------------------------------------------------

export async function getCourse(actor: Actor, courseId: string): Promise<Course> {
  return loadViewableCourse(actor, courseId);
}

/** In the order of `courseIds`, each once; missing courses are dropped like hidden ones. */
export async function getCourses(actor: Actor, courseIds: string[]): Promise<Course[]> {
  const ids = [...new Set(courseIds)].filter(isId);
  if (ids.length === 0) return [];
  const db = getAdminDb();
  const snapshots = await db.getAll(...ids.map(courseDoc));
  const courses = snapshots.flatMap((snapshot) => fromSnapshotOrNull<Course>(snapshot) ?? []);

  // Only a teacher-made course can depend on the actor being enrolled; those are settled with
  // one batched read of the enrollments.
  const undecided = courses.filter(
    (course) => !course.isOfficial && !canViewCourse(actor, course, { enrolled: false }),
  );
  const enrolled = new Set<string>();
  if (!isSystem(actor) && undecided.length > 0) {
    const enrollments = await db.getAll(
      ...undecided.map((course) =>
        collections.enrollments().doc(docIds.enrollment(actor.uid, course.id)),
      ),
    );
    enrollments.forEach((snapshot, index) => {
      if (snapshot.exists) enrolled.add(undecided[index]!.id);
    });
  }
  return courses.filter((course) =>
    canViewCourse(actor, course, { enrolled: enrolled.has(course.id) }),
  );
}

export async function getCourseOutline(actor: Actor, courseId: string): Promise<CourseOutline> {
  const course = await loadViewableCourse(actor, courseId);
  const [moduleDocs, lessonDocs] = await Promise.all([
    collections.modules(courseId).orderBy('order').get(),
    collections.lessons(courseId).get(),
  ]);
  const modules = fromQuery<Module>(moduleDocs, { courseId });
  const position = new Map(modules.map((module, index) => [module.id, index]));
  const lessons = fromQuery<Lesson>(lessonDocs, { courseId }).sort(
    (a, b) =>
      (position.get(a.moduleId) ?? modules.length) - (position.get(b.moduleId) ?? modules.length) ||
      a.order - b.order,
  );
  return { course, modules, lessons };
}

/** The author's own courses, every status. */
export async function listCoursesByOwner(actor: Actor, ownerUid: string): Promise<Course[]> {
  assertId(ownerUid);
  assertCan(isSelfOrAdmin(actor, ownerUid), 'courses.list_by_owner');
  const snapshot = await collections
    .courses()
    .where('ownerUid', '==', ownerUid)
    .orderBy('updatedAt', 'desc')
    .get();
  return fromQuery<Course>(snapshot);
}

/**
 * Courses authored in a school, for its staff. A school admin gets all of them (6.6); a
 * teacher gets the ones shared with the school (`visibility: 'school'`, 3.7), their own
 * private ones being listed by listCoursesByOwner.
 */
export async function listSchoolCourses(actor: Actor, schoolId: string): Promise<Course[]> {
  assertId(schoolId);
  assertCan(
    hasRole(actor, 'teacher', 'school_admin', 'platform_admin') && canViewSchool(actor, schoolId),
    'courses.list_by_school',
  );
  const snapshot = await collections
    .courses()
    .where('schoolId', '==', schoolId)
    .where('isOfficial', '==', false)
    .orderBy('updatedAt', 'desc')
    .get();
  const sharedOnly = !isSystem(actor) && actor.role === 'teacher';
  return fromQuery<Course>(snapshot).filter(
    (course) =>
      (!sharedOnly || course.visibility === 'school') &&
      canViewCourse(actor, course, { enrolled: false }),
  );
}

/** Every official course, drafts and archived ones included: the platform admin's list. */
export async function listOfficialCourses(actor: Actor): Promise<Course[]> {
  assertCan(isPlatformAdmin(actor), 'courses.list_official');
  const snapshot = await collections
    .courses()
    .where('isOfficial', '==', true)
    .orderBy('updatedAt', 'desc')
    .get();
  return fromQuery<Course>(snapshot);
}

// --- Courses: writes ---------------------------------------------------------------------------

// Official courses are always public. A teacher-made course is private or shared with the
// author's school; without a school there is nobody to share it with.
function visibilityOf(
  isOfficial: boolean,
  schoolId: string | null,
  wanted: CourseVisibility,
): CourseVisibility {
  if (isOfficial) return 'public';
  return wanted === 'school' && schoolId !== null ? 'school' : 'private';
}

function assertAgeRange(ageMin: number | null, ageMax: number | null, field: string): void {
  if (ageMin !== null && ageMax !== null && ageMin > ageMax) {
    throw new ValidationError('ageMin is above ageMax.', { [field]: ['age_range'] });
  }
}

async function assertPathwayExists(
  pathwayId: string,
  field: string,
  tx?: Transaction,
): Promise<void> {
  const ref = collections.pathways().doc(pathwayId);
  const snapshot = await (tx ? tx.get(ref) : ref.get());
  if (!snapshot.exists) {
    throw new ValidationError(`pathways/${pathwayId} does not exist.`, { [field]: ['invalid'] });
  }
}

/**
 * A new course is a draft with no cover: the cover is uploaded as media of the course, which
 * needs the id this returns. Only a platform admin's input can make it official, give it a
 * pathway, a position or the premium tier.
 */
export async function createCourse(actor: Actor, input: CourseInput): Promise<Course> {
  assertRole(actor, 'teacher', 'platform_admin');
  const author = requireSession(actor, 'Creating a course');
  const data = parsed(courseInputSchema, input);
  if (data.coverImageFileId !== null) {
    throw new ValidationError('A cover is added after the course exists.', {
      coverImageFileId: ['invalid'],
    });
  }

  const admin = author.role === 'platform_admin';
  const isOfficial = admin && data.isOfficial === true;
  const pathwayId = isOfficial ? (data.pathwayId ?? null) : null;
  if (pathwayId !== null) await assertPathwayExists(pathwayId, 'pathwayId');
  const schoolId = isOfficial ? null : author.schoolId;

  const ref = collections.courses().doc();
  await ref.create({
    pathwayId,
    order: admin ? (data.order ?? 0) : 0,
    ownerUid: author.uid,
    schoolId,
    isOfficial,
    status: 'draft' satisfies CourseStatus,
    visibility: visibilityOf(isOfficial, schoolId, data.visibility),
    audience: data.audience,
    area: data.area,
    tags: data.tags,
    ageMin: data.ageMin,
    ageMax: data.ageMax,
    estimatedMinutes: data.estimatedMinutes,
    accessTier: isOfficial ? (data.accessTier ?? 'free') : 'free',
    certificateEnabled: data.certificateEnabled,
    coverImage: null,
    hardwarePlatformIds: data.hardwarePlatformIds,
    requiredCapabilities: data.requiredCapabilities,
    moduleCount: 0,
    lessonCount: 0,
    defaultLocale: data.defaultLocale,
    translations: data.translations,
    publishedAt: null,
    ...createdNow(),
  });
  return fromSnapshot<Course>(await ref.get());
}

async function resolveCover(actor: Actor, courseId: string, fileId: string): Promise<MediaRef> {
  const [file] = await getCourseMediaFiles(actor, courseId, [fileId]);
  if (!file || file.kind !== 'image') {
    throw new ValidationError('The cover must be an image of this course.', {
      'patch.coverImageFileId': ['file_type_not_allowed'],
    });
  }
  return toMediaRef(file);
}

/**
 * Fields the patch leaves out keep their value. The platform-admin fields are ignored for
 * anyone else. While the course is published, its pathway and its official flag are fixed:
 * `pathways.publishedCourseCount` counts it where it is.
 */
export async function updateCourse(
  actor: Actor,
  courseId: string,
  patch: Partial<CourseInput>,
): Promise<Course> {
  await loadEditableCourse(actor, courseId);
  const data = parsed(updateCourseInputSchema, { courseId, patch }).patch;
  const admin = isPlatformAdmin(actor);
  const coverImage =
    data.coverImageFileId === undefined || data.coverImageFileId === null
      ? data.coverImageFileId
      : await resolveCover(actor, courseId, data.coverImageFileId);

  const ref = courseDoc(courseId);
  await getAdminDb().runTransaction(async (tx) => {
    const course = fromSnapshot<Course>(await tx.get(ref));
    assertCan(canEditCourse(actor, course), 'course.edit');

    const isOfficial = admin && data.isOfficial !== undefined ? data.isOfficial : course.isOfficial;
    const pathwayId = !isOfficial
      ? null
      : admin && data.pathwayId !== undefined
        ? data.pathwayId
        : course.pathwayId;
    if (
      course.status === 'published' &&
      (pathwayId !== course.pathwayId || isOfficial !== course.isOfficial)
    ) {
      throw new ConflictError(`courses/${courseId} is published; its pathway cannot change.`);
    }
    if (pathwayId !== null && pathwayId !== course.pathwayId) {
      await assertPathwayExists(pathwayId, 'patch.pathwayId', tx);
    }
    assertAgeRange(
      data.ageMin === undefined ? course.ageMin : data.ageMin,
      data.ageMax === undefined ? course.ageMax : data.ageMax,
      'patch.ageMax',
    );
    if (data.audience === 'teacher' && course.audience !== 'teacher') {
      // Teachers do not submit projects (3.4), so a course that has project blocks stays a
      // student course.
      const lessons = fromQuery<Lesson>(await tx.get(collections.lessons(courseId)), { courseId });
      if (lessons.some((lesson) => lesson.projectIds.length > 0)) {
        throw new ConflictError(
          `courses/${courseId} has project blocks; it stays a student course.`,
        );
      }
    }

    const schoolId = isOfficial ? null : course.schoolId;
    const wantedVisibility =
      data.visibility ?? (course.visibility === 'public' ? 'private' : course.visibility);
    tx.update(ref, {
      defaultLocale: data.defaultLocale,
      translations: data.translations,
      audience: data.audience,
      area: data.area,
      tags: data.tags,
      ageMin: data.ageMin,
      ageMax: data.ageMax,
      estimatedMinutes: data.estimatedMinutes,
      certificateEnabled: data.certificateEnabled,
      hardwarePlatformIds: data.hardwarePlatformIds,
      requiredCapabilities: data.requiredCapabilities,
      coverImage,
      isOfficial,
      pathwayId,
      schoolId,
      visibility: visibilityOf(isOfficial, schoolId, wantedVisibility),
      order: admin ? data.order : undefined,
      accessTier: isOfficial ? (admin ? data.accessTier : undefined) : 'free',
      ...updatedNow(),
    });
  });
  return loadCourse(courseId);
}

/**
 * Any status may follow any other, but a course is published only when it has content: the
 * transaction reads its modules and lessons and refuses with `ValidationError { status:
 * ['content_required'] }` while `getPublishProblems` finds anything missing (a course already
 * published stays a no-op). `publishedAt` records the first publication, and the pathway's
 * `publishedCourseCount` follows the course in and out of 'published'.
 */
export async function setCourseStatus(
  actor: Actor,
  courseId: string,
  status: CourseStatus,
): Promise<Course> {
  await loadEditableCourse(actor, courseId);
  if (!COURSE_STATUSES.includes(status)) {
    throw new ValidationError('Unknown course status.', { status: ['invalid_choice'] });
  }

  const ref = courseDoc(courseId);
  await getAdminDb().runTransaction(async (tx) => {
    const course = fromSnapshot<Course>(await tx.get(ref));
    if (course.status === status) return;
    const publishing = status === 'published';
    if (publishing) {
      // The rule of the editor's readiness list (WS-F-2), read in the same transaction.
      const modules = fromQuery<Module>(await tx.get(collections.modules(courseId)), { courseId });
      const lessons = fromQuery<Lesson>(await tx.get(collections.lessons(courseId)), { courseId });
      if (getPublishProblems({ modules, lessons }).length > 0) {
        throw new ValidationError('The course is not ready to publish.', {
          status: ['content_required'],
        });
      }
    }
    const crossesPublished = publishing || course.status === 'published';
    const pathwayRef =
      crossesPublished && course.pathwayId !== null
        ? collections.pathways().doc(course.pathwayId)
        : null;
    const pathway = pathwayRef ? await tx.get(pathwayRef) : null;

    tx.update(ref, {
      status,
      publishedAt: publishing && course.publishedAt === null ? serverTimestamp() : undefined,
      ...updatedNow(),
    });
    if (pathwayRef && pathway?.exists) {
      tx.update(pathwayRef, {
        publishedCourseCount: FieldValue.increment(publishing ? 1 : -1),
        ...updatedNow(),
      });
    }
  });
  return loadCourse(courseId);
}

// --- Modules -----------------------------------------------------------------------------------

function moduleDoc(courseId: string, moduleId: string): DocumentReference {
  assertId(moduleId);
  return collections.modules(courseId).doc(moduleId);
}

export async function createModule(
  actor: Actor,
  courseId: string,
  input: ModuleInput,
): Promise<Module> {
  await loadEditableCourse(actor, courseId);
  const data = parsed(createModuleInputSchema, { courseId, input }).input;

  const courseRef = courseDoc(courseId);
  const ref = collections.modules(courseId).doc();
  await getAdminDb().runTransaction(async (tx) => {
    fromSnapshot<Course>(await tx.get(courseRef));
    const modules = fromQuery<Module>(
      await tx.get(collections.modules(courseId).orderBy('order')),
      { courseId },
    );
    if (modules.length >= CONTENT_LIMITS.modulesPerCourse) {
      throw new ConflictError(`courses/${courseId} has the most modules a course can hold.`);
    }
    tx.create(ref, {
      order: nextOrder(modules),
      lessonCount: 0,
      defaultLocale: data.defaultLocale,
      translations: data.translations,
      ...createdNow(),
    });
    tx.update(courseRef, { moduleCount: modules.length + 1, ...updatedNow() });
  });
  return fromSnapshot<Module>(await ref.get(), { courseId });
}

export async function updateModule(
  actor: Actor,
  courseId: string,
  moduleId: string,
  patch: Partial<ModuleInput>,
): Promise<Module> {
  await loadEditableCourse(actor, courseId);
  const data = parsed(updateModuleInputSchema, { courseId, moduleId, patch }).patch;
  const ref = moduleDoc(courseId, moduleId);
  await updateExisting(ref, {
    defaultLocale: data.defaultLocale,
    translations: data.translations,
    ...updatedNow(),
  });
  return fromSnapshot<Module>(await ref.get(), { courseId });
}

/** Only an empty module can be deleted: its lessons are deleted, or moved out, first. */
export async function deleteModule(
  actor: Actor,
  courseId: string,
  moduleId: string,
): Promise<void> {
  await loadEditableCourse(actor, courseId);
  const courseRef = courseDoc(courseId);
  const ref = moduleDoc(courseId, moduleId);
  await getAdminDb().runTransaction(async (tx) => {
    fromSnapshot<Course>(await tx.get(courseRef));
    fromSnapshot<Module>(await tx.get(ref), { courseId });
    await assertNoEnrollments(tx, courseId);
    const modules = await tx.get(collections.modules(courseId).orderBy('order'));
    const lessons = fromQuery<Lesson>(await tx.get(collections.lessons(courseId)), { courseId });
    if (lessons.some((lesson) => lesson.moduleId === moduleId)) {
      throw new ConflictError(`Module ${moduleId} still has lessons.`);
    }
    tx.delete(ref);
    tx.update(courseRef, { moduleCount: modules.size - 1, ...updatedNow() });
  });
}

export async function reorderModules(
  actor: Actor,
  courseId: string,
  orderedIds: string[],
): Promise<void> {
  await loadEditableCourse(actor, courseId);
  await getAdminDb().runTransaction(async (tx) => {
    const modules = await tx.get(collections.modules(courseId).orderBy('order'));
    assertSameIds(
      orderedIds,
      modules.docs.map((document) => document.id),
      'modules',
    );
    orderedIds.forEach((moduleId, order) => {
      tx.update(collections.modules(courseId).doc(moduleId), { order, ...updatedNow() });
    });
    tx.update(courseDoc(courseId), updatedNow());
  });
}

// --- Lessons -----------------------------------------------------------------------------------

function lessonDoc(courseId: string, lessonId: string): DocumentReference {
  assertId(lessonId);
  return collections.lessons(courseId).doc(lessonId);
}

export async function getLesson(actor: Actor, courseId: string, lessonId: string): Promise<Lesson> {
  await loadViewableCourse(actor, courseId);
  return fromSnapshot<Lesson>(await lessonDoc(courseId, lessonId).get(), { courseId });
}

export async function createLesson(
  actor: Actor,
  courseId: string,
  moduleId: string,
  input: LessonInput,
): Promise<Lesson> {
  await loadEditableCourse(actor, courseId);
  const data = parsed(createLessonInputSchema, { courseId, moduleId, input }).input;

  const courseRef = courseDoc(courseId);
  const moduleRef = moduleDoc(courseId, moduleId);
  const ref = collections.lessons(courseId).doc();
  await getAdminDb().runTransaction(async (tx) => {
    fromSnapshot<Course>(await tx.get(courseRef));
    fromSnapshot<Module>(await tx.get(moduleRef), { courseId });
    const lessons = fromQuery<Lesson>(await tx.get(collections.lessons(courseId)), { courseId });
    const siblings = lessons.filter((lesson) => lesson.moduleId === moduleId);
    if (siblings.length >= CONTENT_LIMITS.lessonsPerModule) {
      throw new ConflictError(`Module ${moduleId} has the most lessons a module can hold.`);
    }
    tx.create(ref, {
      moduleId,
      order: nextOrder(siblings),
      estimatedMinutes: data.estimatedMinutes,
      xpReward: data.xpReward,
      ...deriveLessonFields([]),
      defaultLocale: data.defaultLocale,
      translations: data.translations,
      ...createdNow(),
    });
    tx.update(moduleRef, { lessonCount: siblings.length + 1, ...updatedNow() });
    tx.update(courseRef, { lessonCount: lessons.length + 1, ...updatedNow() });
  });
  return fromSnapshot<Lesson>(await ref.get(), { courseId });
}

export async function updateLesson(
  actor: Actor,
  courseId: string,
  lessonId: string,
  patch: Partial<LessonInput>,
): Promise<Lesson> {
  await loadEditableCourse(actor, courseId);
  const data = parsed(updateLessonInputSchema, { courseId, lessonId, patch }).patch;
  const ref = lessonDoc(courseId, lessonId);
  await updateExisting(ref, {
    defaultLocale: data.defaultLocale,
    translations: data.translations,
    estimatedMinutes: data.estimatedMinutes,
    xpReward: data.xpReward,
    ...updatedNow(),
  });
  return fromSnapshot<Lesson>(await ref.get(), { courseId });
}

/** Deletes the lesson with its blocks and frees the quizzes and projects they pointed at. */
export async function deleteLesson(
  actor: Actor,
  courseId: string,
  lessonId: string,
): Promise<void> {
  await loadEditableCourse(actor, courseId);
  const courseRef = courseDoc(courseId);
  const ref = lessonDoc(courseId, lessonId);
  await getAdminDb().runTransaction(async (tx) => {
    fromSnapshot<Course>(await tx.get(courseRef));
    const lesson = fromSnapshot<Lesson>(await tx.get(ref), { courseId });
    await assertNoEnrollments(tx, courseId);
    const moduleRef = collections.modules(courseId).doc(lesson.moduleId);
    const moduleSnapshot = await tx.get(moduleRef);
    const lessons = fromQuery<Lesson>(await tx.get(collections.lessons(courseId)), { courseId });
    const blocks = await readBlocks(tx, courseId, lessonId);
    const links = blocks.flatMap((block) => linkedContent(block) ?? []);
    const linked =
      links.length > 0 ? await tx.getAll(...links.map((link) => linkDoc(courseId, link))) : [];

    for (const block of blocks) tx.delete(collections.blocks(courseId, lessonId).doc(block.id));
    for (const snapshot of linked) {
      if (snapshot.exists) tx.update(snapshot.ref, { lessonId: null, ...updatedNow() });
    }
    tx.delete(ref);
    if (moduleSnapshot.exists) {
      const siblings = lessons.filter((other) => other.moduleId === lesson.moduleId);
      tx.update(moduleRef, { lessonCount: siblings.length - 1, ...updatedNow() });
    }
    tx.update(courseRef, { lessonCount: lessons.length - 1, ...updatedNow() });
  });
}

export async function reorderLessons(
  actor: Actor,
  courseId: string,
  moduleId: string,
  orderedIds: string[],
): Promise<void> {
  await loadEditableCourse(actor, courseId);
  assertId(moduleId);
  await getAdminDb().runTransaction(async (tx) => {
    const lessons = fromQuery<Lesson>(await tx.get(collections.lessons(courseId)), { courseId });
    assertSameIds(
      orderedIds,
      lessons.filter((lesson) => lesson.moduleId === moduleId).map((lesson) => lesson.id),
      'lessons',
    );
    orderedIds.forEach((lessonId, order) => {
      tx.update(collections.lessons(courseId).doc(lessonId), { order, ...updatedNow() });
    });
    tx.update(courseDoc(courseId), updatedNow());
  });
}

// --- Blocks ------------------------------------------------------------------------------------
//
// Every block write is one transaction that also rewrites what the lesson derives from its
// blocks (blockCount, quizIds, projectIds, reflectionBlockIds, tutorExcerpt) and moves the
// reverse link of a quiz or project: set when a block starts to reference it, cleared when
// the block stops or is deleted. A quiz or project can be referenced by one block only.

export async function listBlocks(
  actor: Actor,
  courseId: string,
  lessonId: string,
): Promise<LessonBlock[]> {
  await loadViewableCourse(actor, courseId);
  assertId(lessonId);
  const snapshot = await collections.blocks(courseId, lessonId).orderBy('order').get();
  return fromQuery<LessonBlock>(snapshot, { courseId, lessonId });
}

async function readBlocks(tx: Transaction, courseId: string, lessonId: string) {
  const snapshot = await tx.get(collections.blocks(courseId, lessonId).orderBy('order'));
  return fromQuery<LessonBlock>(snapshot, { courseId, lessonId });
}

type ContentLink = NonNullable<ReturnType<typeof linkedContent>>;

function linkDoc(courseId: string, link: ContentLink): DocumentReference {
  assertId(link.id);
  return link.kind === 'quiz'
    ? collections.quizzes(courseId).doc(link.id)
    : collections.projects(courseId).doc(link.id);
}

function sameLink(a: ContentLink | null, b: ContentLink | null): boolean {
  return a?.kind === b?.kind && a?.id === b?.id;
}

/** The quiz or project must exist in this course and be free. Reads; call before any write. */
async function assertLinkable(
  tx: Transaction,
  course: Course,
  link: ContentLink,
): Promise<DocumentReference> {
  if (link.kind === 'project' && course.audience === 'teacher') {
    throw new ConflictError('A course for teachers cannot contain project blocks.');
  }
  const ref = linkDoc(course.id, link);
  const snapshot = await tx.get(ref);
  if (!snapshot.exists) throw new NotFoundError(`${ref.path} does not exist.`);
  const linkedTo: unknown = snapshot.get('lessonId');
  if (linkedTo !== null && linkedTo !== undefined) {
    throw new ConflictError(
      `${ref.path} is already used by a block of lesson ${String(linkedTo)}.`,
    );
  }
  return ref;
}

// The files an editor's block names must be media of this course, of the kind the block shows.
async function resolveBlock(
  actor: Actor,
  courseId: string,
  input: BlockInput,
): Promise<BlockFields> {
  const fileIds = blockFileIds(input);
  const files = fileIds.length > 0 ? await getCourseMediaFiles(actor, courseId, fileIds) : [];
  const wrongKind =
    (input.type === 'image' || input.type === 'video') &&
    files.some((file) => file.kind !== input.type);
  if (wrongKind) {
    throw new ValidationError(`A ${input.type} block needs a file of that kind.`, {
      'input.data.fileId': ['file_type_not_allowed'],
    });
  }
  return toBlockFields(input, new Map(files.map((file) => [file.id, toMediaRef(file)])));
}

function writeDerivedFields(
  tx: Transaction,
  courseId: string,
  lessonId: string,
  blocks: readonly DerivableBlock[],
): void {
  tx.update(collections.lessons(courseId).doc(lessonId), {
    ...deriveLessonFields(blocks),
    ...updatedNow(),
  });
}

export async function createBlock(
  actor: Actor,
  courseId: string,
  lessonId: string,
  input: BlockInput,
): Promise<LessonBlock> {
  await loadEditableCourse(actor, courseId);
  const data = parsed(createBlockInputSchema, { courseId, lessonId, input }).input;
  const fields = await resolveBlock(actor, courseId, data);
  const link = linkedContent(fields);

  const ref = collections.blocks(courseId, lessonId).doc();
  await getAdminDb().runTransaction(async (tx) => {
    const course = fromSnapshot<Course>(await tx.get(courseDoc(courseId)));
    fromSnapshot<Lesson>(await tx.get(lessonDoc(courseId, lessonId)), { courseId });
    const blocks = await readBlocks(tx, courseId, lessonId);
    if (blocks.length >= CONTENT_LIMITS.blocksPerLesson) {
      throw new ConflictError(`Lesson ${lessonId} has the most blocks a lesson can hold.`);
    }
    const linkRef = link ? await assertLinkable(tx, course, link) : null;

    const order = nextOrder(blocks);
    tx.create(ref, { ...fields, order, ...createdNow() });
    if (linkRef) tx.update(linkRef, { lessonId, ...updatedNow() });
    writeDerivedFields(tx, courseId, lessonId, [...blocks, { ...fields, id: ref.id, order }]);
  });
  return fromSnapshot<LessonBlock>(await ref.get(), { courseId, lessonId });
}

/** Replaces the block's type, stage, text and data; its position stays. */
export async function updateBlock(
  actor: Actor,
  courseId: string,
  lessonId: string,
  blockId: string,
  input: BlockInput,
): Promise<LessonBlock> {
  await loadEditableCourse(actor, courseId);
  const data = parsed(updateBlockInputSchema, { courseId, lessonId, blockId, input }).input;
  const fields = await resolveBlock(actor, courseId, data);
  const link = linkedContent(fields);

  const ref = collections.blocks(courseId, lessonId).doc(blockId);
  await getAdminDb().runTransaction(async (tx) => {
    const course = fromSnapshot<Course>(await tx.get(courseDoc(courseId)));
    const blocks = await readBlocks(tx, courseId, lessonId);
    const current = blocks.find((block) => block.id === blockId);
    if (!current) throw new NotFoundError(`${ref.path} does not exist.`);
    const previousLink = linkedContent(current);
    const relinked = !sameLink(previousLink, link);
    const linkRef = relinked && link ? await assertLinkable(tx, course, link) : null;
    const previousRef = relinked && previousLink ? linkDoc(courseId, previousLink) : null;
    const previous = previousRef ? await tx.get(previousRef) : null;

    tx.update(ref, { ...fields, ...updatedNow() });
    if (previousRef && previous?.exists) {
      tx.update(previousRef, { lessonId: null, ...updatedNow() });
    }
    if (linkRef) tx.update(linkRef, { lessonId, ...updatedNow() });
    writeDerivedFields(
      tx,
      courseId,
      lessonId,
      blocks.map((block) =>
        block.id === blockId ? { ...fields, id: blockId, order: block.order } : block,
      ),
    );
  });
  return fromSnapshot<LessonBlock>(await ref.get(), { courseId, lessonId });
}

export async function deleteBlock(
  actor: Actor,
  courseId: string,
  lessonId: string,
  blockId: string,
): Promise<void> {
  await loadEditableCourse(actor, courseId);
  assertId(lessonId);
  assertId(blockId);
  const ref = collections.blocks(courseId, lessonId).doc(blockId);
  await getAdminDb().runTransaction(async (tx) => {
    await assertNoEnrollments(tx, courseId);
    const blocks = await readBlocks(tx, courseId, lessonId);
    const current = blocks.find((block) => block.id === blockId);
    if (!current) throw new NotFoundError(`${ref.path} does not exist.`);
    const link = linkedContent(current);
    const linkRef = link ? linkDoc(courseId, link) : null;
    const linked = linkRef ? await tx.get(linkRef) : null;

    tx.delete(ref);
    if (linkRef && linked?.exists) tx.update(linkRef, { lessonId: null, ...updatedNow() });
    writeDerivedFields(
      tx,
      courseId,
      lessonId,
      blocks.filter((block) => block.id !== blockId),
    );
  });
}

export async function reorderBlocks(
  actor: Actor,
  courseId: string,
  lessonId: string,
  orderedIds: string[],
): Promise<void> {
  await loadEditableCourse(actor, courseId);
  assertId(lessonId);
  await getAdminDb().runTransaction(async (tx) => {
    const blocks = await readBlocks(tx, courseId, lessonId);
    assertSameIds(
      orderedIds,
      blocks.map((block) => block.id),
      'blocks',
    );
    const position = new Map(orderedIds.map((blockId, order) => [blockId, order]));
    const reordered = blocks.map((block) => ({ ...block, order: position.get(block.id)! }));
    for (const block of reordered) {
      tx.update(collections.blocks(courseId, lessonId).doc(block.id), {
        order: block.order,
        ...updatedNow(),
      });
    }
    if (reordered.length > 0) writeDerivedFields(tx, courseId, lessonId, reordered);
  });
}
