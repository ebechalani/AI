// Runs every list and aggregation query of the repositories (ARCHITECTURE.md 3.7) against a
// project, so a composite index missing from firestore.indexes.json fails here, with
// Firestore's index link, instead of on a page. Read-only. The emulators enforce no index, so
// there the run only proves the calls work; the purpose is a real project after
// "npm run deploy:rules".
//
//   npm run smoke:queries -- [--allow-project <id>] [--yes]

import { SYSTEM_ACTOR, type Actor } from '@/lib/auth/actor';
import {
  getClassReport,
  getPlatformStats,
  getSchoolCourseUsage,
  getSchoolStats,
} from '@/lib/data/analytics';
import { listBadges, listUserBadges } from '@/lib/data/badges';
import {
  listAllLicenses,
  listLicensesForSchool,
  listSubscriptions,
  listSubscriptionsForOwner,
} from '@/lib/data/billing';
import {
  getCertificateByCode,
  listAllCertificates,
  listCertificatesForSchool,
  listCertificatesForUser,
} from '@/lib/data/certificates';
import { listAllChallenges, listChallengesForUser } from '@/lib/data/challenges';
import {
  findClassByJoinCode,
  listAssignments,
  listClassesForSchool,
  listClassesForTeacher,
  listMembers,
} from '@/lib/data/classes';
import {
  getCourseOutline,
  getPublishedCourse,
  listBlocks,
  listCoursesByOwner,
  listOfficialCourses,
  listPublishedCoursesByArea,
  listPublishedCoursesByPathway,
  listSchoolCourses,
} from '@/lib/data/courses';
import { getEnrollmentsForUsers, listEnrollmentsForUser } from '@/lib/data/enrollments';
import { listHardwarePlatforms } from '@/lib/data/hardware';
import { getPublishedPathway, listPathways, listPublishedPathways } from '@/lib/data/pathways';
import { listProjects } from '@/lib/data/projects';
import {
  listAttemptsForClass,
  listAttemptsForClasses,
  listQuizzes,
  listRecentAttemptsForUser,
} from '@/lib/data/quizzes';
import { listSchools } from '@/lib/data/schools';
import {
  countReviewQueue,
  getLatestSubmission,
  listOpenSubmissionsForStudent,
  listReviewQueue,
  listSubmissionsForChallenge,
  listSubmissionsForClass,
  listSubmissionsForStudent,
} from '@/lib/data/submissions';
import { getUser, listSchoolUsers, listUsersByRole } from '@/lib/data/users';
import { listXpEntries } from '@/lib/data/xp';
import type { Session } from '@/types/user';
import {
  COMMON_USAGE,
  connect,
  parseScriptArgs,
  runScript,
  sessionOf,
  step,
  targetOptions,
} from './lib/admin';

const USAGE = `Usage: npm run smoke:queries -- [options]

Runs every repository list query once, as the system and as sample users found in the data,
and reports the ones Firestore refuses (a missing composite index, most likely).
${COMMON_USAGE}`;

interface Samples {
  schoolId: string | null;
  classId: string | null;
  joinCode: string | null;
  teacherUid: string | null;
  studentUid: string | null;
  memberUids: string[];
  courseId: string | null;
  assignedCourseId: string | null;
  courseOwnerUid: string | null;
  lessonId: string | null;
  pathwayId: string | null;
  challengeId: string | null;
  verificationCode: string | null;
  student: Session | null;
  schoolViewer: Session | null;
}

/** Ids to query with, taken from whatever the project holds; null where there is nothing. */
async function findSamples(): Promise<Samples> {
  const schoolId = (await listSchools(SYSTEM_ACTOR, { limit: 1 })).items[0]?.id ?? null;
  const classes =
    schoolId === null
      ? []
      : await listClassesForSchool(SYSTEM_ACTOR, schoolId, { includeArchived: true });
  const cls = classes[0] ?? null;
  const members = cls === null ? [] : await listMembers(SYSTEM_ACTOR, cls.id);
  const studentUid = members[0]?.id ?? null;
  const student = studentUid === null ? null : sessionOf(await getUser(SYSTEM_ACTOR, studentUid));
  const pathway = (await listPublishedPathways())[0] ?? null;
  const course =
    (pathway === null ? [] : await listPublishedCoursesByPathway(pathway.id))[0] ??
    (await listOfficialCourses(SYSTEM_ACTOR))[0] ??
    null;
  const outline = course === null ? null : await getCourseOutline(SYSTEM_ACTOR, course.id);
  const challenge = (await listAllChallenges(SYSTEM_ACTOR))[0] ?? null;
  const certificate = (await listAllCertificates(SYSTEM_ACTOR, { limit: 1 })).items[0] ?? null;
  const schoolViewer: Session | null =
    schoolId === null
      ? null
      : {
          uid: 'smoke-viewer',
          role: 'school_admin',
          schoolId,
          classIds: [],
          displayName: 'Smoke viewer',
          locale: 'en',
          ageBand: 'adult',
          avatarId: 'robot',
          verifiedEducator: false,
        };
  return {
    schoolId,
    classId: cls?.id ?? null,
    joinCode: cls?.joinCode ?? null,
    teacherUid: cls?.ownerUid ?? null,
    studentUid,
    memberUids: members.map((member) => member.id),
    courseId: course?.id ?? null,
    assignedCourseId: cls?.assignedCourseIds[0] ?? null,
    courseOwnerUid: course?.ownerUid ?? null,
    lessonId: outline?.lessons[0]?.id ?? null,
    pathwayId: pathway?.id ?? null,
    challengeId: challenge?.id ?? null,
    verificationCode: certificate?.verificationCode ?? null,
    student,
    schoolViewer,
  };
}

/** A check that needs a sample; skipped, not failed, when the project has none. */
function needs<T>(sample: T | null, what: string, run: (sample: T) => Promise<unknown>) {
  return sample === null ? { skip: `no ${what} in the data` } : { run: () => run(sample) };
}

type Planned = { skip: string } | { run: () => Promise<unknown> };

function checks(s: Samples): { name: string; planned: Planned }[] {
  const system: Actor = SYSTEM_ACTOR;
  const limit = { limit: 10 };
  return [
    { name: 'pathways: published by order', planned: { run: () => listPublishedPathways() } },
    { name: 'pathways: all (admin select)', planned: { run: () => listPathways(system) } },
    {
      name: 'pathways: one published',
      planned: needs(s.pathwayId, 'pathway', (id) => getPublishedPathway(id)),
    },
    {
      name: 'courses: published by pathway',
      planned: needs(s.pathwayId, 'pathway', (id) => listPublishedCoursesByPathway(id)),
    },
    {
      name: 'courses: published by area (robotics)',
      planned: { run: () => listPublishedCoursesByArea('robotics') },
    },
    {
      name: 'courses: one published',
      planned: needs(s.courseId, 'course', (id) => getPublishedCourse(id)),
    },
    {
      name: 'courses: by owner',
      planned: needs(s.courseOwnerUid, 'course', (uid) => listCoursesByOwner(system, uid)),
    },
    {
      name: 'courses: of a school',
      planned: needs(s.schoolId, 'school', (id) => listSchoolCourses(system, id)),
    },
    { name: 'courses: official', planned: { run: () => listOfficialCourses(system) } },
    {
      name: 'courses: outline',
      planned: needs(s.courseId, 'course', (id) => getCourseOutline(system, id)),
    },
    {
      name: 'courses: blocks of a lesson',
      planned: needs(s.lessonId, 'lesson', (lessonId) => listBlocks(system, s.courseId!, lessonId)),
    },
    {
      name: 'courses: quizzes and projects',
      planned: needs(s.courseId, 'course', (id) =>
        Promise.all([listQuizzes(system, id), listProjects(system, id)]),
      ),
    },
    { name: 'schools: by name', planned: { run: () => listSchools(system, limit) } },
    {
      name: 'users: of a school by role',
      planned: needs(s.schoolId, 'school', (id) => listSchoolUsers(system, id, 'student', limit)),
    },
    {
      name: 'users: by role, newest first',
      planned: { run: () => listUsersByRole(system, 'teacher', limit) },
    },
    {
      name: 'classes: of a teacher (active, then archived included)',
      planned: needs(s.teacherUid, 'class', (uid) =>
        Promise.all([
          listClassesForTeacher(system, uid),
          listClassesForTeacher(system, uid, { includeArchived: true }),
        ]),
      ),
    },
    {
      name: 'classes: of a school (active, then archived included)',
      planned: needs(s.schoolId, 'school', (id) =>
        Promise.all([
          listClassesForSchool(system, id),
          listClassesForSchool(system, id, { includeArchived: true }),
        ]),
      ),
    },
    {
      name: 'classes: members and assignments',
      planned: needs(s.classId, 'class', (id) =>
        Promise.all([listMembers(system, id), listAssignments(system, id)]),
      ),
    },
    {
      name: 'classes: by join code',
      planned: needs(s.joinCode, 'class', (code) => findClassByJoinCode(system, code)),
    },
    {
      name: 'enrollments: of a learner, most recent first',
      planned: needs(s.student, 'student', (student) =>
        listEnrollmentsForUser(student, student.uid),
      ),
    },
    {
      name: 'enrollments: of a learner in a class',
      planned: needs(s.studentUid, 'student', (uid) =>
        listEnrollmentsForUser(system, uid, { classId: s.classId! }),
      ),
    },
    {
      name: 'enrollments: of a roster in a course (report)',
      planned: needs(s.assignedCourseId, 'assigned course', (courseId) =>
        getEnrollmentsForUsers(system, s.memberUids, courseId),
      ),
    },
    {
      name: 'quizAttempts: recent of a learner (all, then in a class)',
      planned: needs(s.studentUid, 'student', (uid) =>
        Promise.all([
          listRecentAttemptsForUser(system, uid, { limit: 3 }),
          listRecentAttemptsForUser(system, uid, { limit: 3, classId: s.classId! }),
        ]),
      ),
    },
    {
      name: 'quizAttempts: of a class (all, then one course)',
      planned: needs(s.classId, 'class', (id) =>
        Promise.all([
          listAttemptsForClass(system, id),
          listAttemptsForClass(system, id, { courseId: s.assignedCourseId ?? s.courseId ?? 'x' }),
        ]),
      ),
    },
    {
      name: 'quizAttempts: newest across classes',
      planned: needs(s.classId, 'class', (id) => listAttemptsForClasses(system, [id], 10)),
    },
    {
      name: 'submissions: of a student (all, then challenge entries)',
      planned: needs(s.student, 'student', (student) =>
        Promise.all([
          listSubmissionsForStudent(student, student.uid),
          listSubmissionsForStudent(student, student.uid, { context: 'challenge' }),
        ]),
      ),
    },
    {
      name: 'submissions: of a student in a class',
      planned: needs(s.studentUid, 'student', (uid) =>
        listSubmissionsForStudent(system, uid, { classId: s.classId! }),
      ),
    },
    {
      name: 'submissions: review queue and its count',
      planned: needs(s.classId, 'class', (id) =>
        Promise.all([listReviewQueue(system, [id]), countReviewQueue(system, [id])]),
      ),
    },
    {
      name: 'submissions: of a class, newest first',
      planned: needs(s.classId, 'class', (id) => listSubmissionsForClass(system, id)),
    },
    {
      name: 'submissions: of a challenge',
      planned: needs(s.challengeId, 'challenge', (id) => listSubmissionsForChallenge(system, id)),
    },
    {
      name: 'submissions: latest challenge entry of a student',
      planned: needs(s.challengeId, 'challenge', (challengeId) =>
        getLatestSubmission(system, s.studentUid ?? 'nobody', { challengeId }),
      ),
    },
    {
      name: 'submissions: open ones of a student (all, then one course)',
      planned: needs(s.studentUid, 'student', (uid) =>
        Promise.all([
          listOpenSubmissionsForStudent(system, uid, {}),
          listOpenSubmissionsForStudent(system, uid, { courseId: s.courseId ?? 'x' }),
        ]),
      ),
    },
    {
      name: 'certificates: of a user',
      planned: needs(s.studentUid, 'student', (uid) => listCertificatesForUser(system, uid)),
    },
    {
      name: 'certificates: of a school',
      planned: needs(s.schoolId, 'school', (id) => listCertificatesForSchool(system, id)),
    },
    { name: 'certificates: all', planned: { run: () => listAllCertificates(system, limit) } },
    {
      name: 'certificates: by verification code',
      planned: needs(s.verificationCode, 'certificate', (code) => getCertificateByCode(code)),
    },
    {
      name: 'challenges: global (all, then upcoming or open)',
      planned: {
        run: () =>
          Promise.all([
            listChallengesForUser(system),
            listChallengesForUser(system, { upcomingOrOpenOnly: true, limit: 3 }),
          ]),
      },
    },
    {
      name: 'challenges: global and of a school',
      planned: needs(s.schoolViewer, 'school', (viewer) => listChallengesForUser(viewer)),
    },
    { name: 'challenges: all', planned: { run: () => listAllChallenges(system) } },
    {
      name: 'licenses: of a school',
      planned: needs(s.schoolId, 'school', (id) => listLicensesForSchool(system, id)),
    },
    { name: 'licenses: all', planned: { run: () => listAllLicenses(system, limit) } },
    { name: 'subscriptions: all', planned: { run: () => listSubscriptions(system, limit) } },
    {
      name: 'subscriptions: of an owner',
      planned: needs(s.schoolId, 'school', (id) => listSubscriptionsForOwner(system, 'school', id)),
    },
    {
      name: 'badges and hardware',
      planned: { run: () => Promise.all([listBadges(system), listHardwarePlatforms(system)]) },
    },
    {
      name: 'users: badges and XP ledger',
      planned: needs(s.studentUid, 'student', (uid) =>
        Promise.all([listUserBadges(system, uid, { limit: 6 }), listXpEntries(system, uid, 20)]),
      ),
    },
    {
      name: 'analytics: school stats and course usage',
      planned: needs(s.schoolId, 'school', (id) =>
        Promise.all([getSchoolStats(system, id), getSchoolCourseUsage(system, id)]),
      ),
    },
    {
      name: 'analytics: class report',
      planned: needs(s.assignedCourseId, 'assigned course', (courseId) =>
        getClassReport(system, s.classId!, courseId),
      ),
    },
    { name: 'analytics: platform stats', planned: { run: () => getPlatformStats(system) } },
  ];
}

async function main(): Promise<void> {
  const { values } = parseScriptArgs({}, USAGE);
  await connect(targetOptions(values));

  step('Samples');
  const samples = await findSamples();
  console.log(
    `   school ${samples.schoolId ?? '-'}, class ${samples.classId ?? '-'}, student ${samples.studentUid ?? '-'}, course ${samples.courseId ?? '-'}, challenge ${samples.challengeId ?? '-'}`,
  );

  step('Queries');
  let passed = 0;
  let skipped = 0;
  const failures: string[] = [];
  for (const { name, planned } of checks(samples)) {
    if ('skip' in planned) {
      skipped += 1;
      console.log(`   skip  ${name} (${planned.skip})`);
      continue;
    }
    try {
      await planned.run();
      passed += 1;
      console.log(`   ok    ${name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${name}: ${message}`);
      console.log(`   FAIL  ${name}\n         ${message.split('\n')[0]}`);
    }
  }

  console.log(`\nsmoke-queries: ${passed} passed, ${skipped} skipped, ${failures.length} failed.`);
  if (failures.length > 0) {
    throw new Error(`Queries refused:\n  ${failures.join('\n  ')}`);
  }
}

runScript(main);
