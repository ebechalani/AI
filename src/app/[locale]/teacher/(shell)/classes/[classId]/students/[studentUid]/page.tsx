import type { Metadata } from 'next';
import { UserX } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { AwardBadgeForm } from '@/components/classes/AwardBadgeForm';
import { STUDENT_ATTEMPTS_LIMIT } from '@/components/classes/class-model';
import { RemoveStudentButton } from '@/components/classes/RemoveStudentButton';
import { ResetPasswordCard } from '@/components/classes/ResetPasswordCard';
import { StudentAttemptsTable } from '@/components/classes/StudentAttemptsTable';
import { StudentBadges } from '@/components/classes/StudentBadges';
import { StudentProgressList } from '@/components/classes/StudentProgressList';
import { StudentSubmissions } from '@/components/classes/StudentSubmissions';
import { StudentSummaryCard } from '@/components/classes/StudentSummaryCard';
import { PageHeader } from '@/components/layout';
import { classPath, TEACHER_PATHS } from '@/components/teacher/paths';
import { Card, CardTitle, EmptyState, LinkButton } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { listBadges, listUserBadges } from '@/lib/data/badges';
import { getCourses } from '@/lib/data/courses';
import { listEnrollmentsForUser } from '@/lib/data/enrollments';
import { listRecentAttemptsForUser } from '@/lib/data/quizzes';
import { listSubmissionsForStudent } from '@/lib/data/submissions';
import { isAppError } from '@/lib/errors';
import { pickTranslation } from '@/lib/i18n/content';
import type { StudentSummary } from '@/types/user';
import { classOrNotFound, loadStudent } from '../../_lib/load';

type Params = Promise<{ classId: string; studentUid: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  await requireRole('teacher');
  const { classId, studentUid } = await params;
  try {
    return { title: (await loadStudent(classId, studentUid)).displayName };
  } catch (error) {
    if (!isAppError(error)) throw error;
    const tNav = await getTranslations('nav');
    return { title: tNav('teacher.classes') };
  }
}

// One student of a class (ARCHITECTURE.md 6.5, 3.7 "Student detail (teacher)" with WS-E-1):
// progress, quiz attempts, projects and badges in this class, and what the teacher can do.
export default async function TeacherClassStudentPage({ params }: { params: Params }) {
  const session = await requireRole('teacher');
  const { classId, studentUid } = await params;
  const cls = await classOrNotFound(classId);
  const [locale, t, tNav] = await Promise.all([
    getLocale(),
    getTranslations('classes'),
    getTranslations('nav'),
  ]);

  let summary: StudentSummary | null = null;
  try {
    summary = await loadStudent(classId, studentUid);
  } catch (error) {
    if (!(isAppError(error) && error.code === 'not_found')) throw error;
  }

  const classCrumbs = [
    { label: tNav('teacher.classes'), href: TEACHER_PATHS.classes },
    { label: cls.name, href: classPath(cls.id) },
  ];

  // WS-C and WS-D link here from historical records: the student may have left the class.
  // `wrap-anywhere`: a class name may be one long word, and the centred empty state and its
  // button size to their content; it must wrap at 375 px instead of widening the page (7.1).
  if (summary === null) {
    const title = t('student.notMember.title', { className: cls.name });
    return (
      <>
        <PageHeader title={title} breadcrumbs={classCrumbs} className="wrap-anywhere" />
        <EmptyState
          className="wrap-anywhere"
          icon={<UserX />}
          title={title}
          description={t('student.notMember.description')}
          action={
            <LinkButton href={classPath(cls.id)}>
              {t('student.notMember.back', { className: cls.name })}
            </LinkButton>
          }
        />
      </>
    );
  }

  const [enrollments, attempts, submissions, badges, userBadges] = await Promise.all([
    listEnrollmentsForUser(session, studentUid, { classId }),
    listRecentAttemptsForUser(session, studentUid, { limit: STUDENT_ATTEMPTS_LIMIT, classId }),
    listSubmissionsForStudent(session, studentUid, { classId }),
    listBadges(session),
    listUserBadges(session, studentUid),
  ]);
  const courses = await getCourses(session, [
    ...new Set([
      ...enrollments.map((enrollment) => enrollment.courseId),
      ...attempts.map((attempt) => attempt.courseId),
    ]),
  ]);

  const courseTitles = Object.fromEntries(
    courses.map((course) => [
      course.id,
      pickTranslation(course.translations, locale, course.defaultLocale).title,
    ]),
  );
  const heldIds = new Set(userBadges.map((userBadge) => userBadge.badgeId));
  const badgeOptions = badges
    .filter((badge) => badge.isActive && badge.criteria.type === 'manual')
    .map((badge) => ({
      id: badge.id,
      name: pickTranslation(badge.translations, locale, badge.defaultLocale).name,
      held: heldIds.has(badge.id),
    }));
  const badgesById = new Map(badges.map((badge) => [badge.id, badge]));
  const heldTiles = userBadges.flatMap((userBadge) => {
    const badge = badgesById.get(userBadge.badgeId);
    return badge === undefined ? [] : [{ badge, awardedAt: userBadge.awardedAt }];
  });

  return (
    <>
      <PageHeader
        title={summary.displayName}
        breadcrumbs={[...classCrumbs, { label: summary.displayName }]}
        actions={
          <LinkButton href={classPath(cls.id)} variant="secondary">
            {t('student.backToClass')}
          </LinkButton>
        }
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <aside className="flex min-w-0 flex-col gap-6 lg:col-start-3 lg:row-start-1">
          <StudentSummaryCard summary={summary} className={cls.name} />
          <ResetPasswordCard summary={summary} className={cls.name} />
          <AwardBadgeForm
            studentUid={summary.uid}
            studentName={summary.displayName}
            options={badgeOptions}
          />
          {!cls.archived && (
            <Card className="gap-3 p-5 sm:p-6">
              <CardTitle as="h2" className="text-lg">
                {t('student.manage.title')}
              </CardTitle>
              <div>
                <RemoveStudentButton
                  classId={cls.id}
                  className={cls.name}
                  studentUid={summary.uid}
                  studentName={summary.displayName}
                  redirectTo={classPath(cls.id)}
                  variant="full"
                />
              </div>
            </Card>
          )}
        </aside>
        <div className="flex min-w-0 flex-col gap-8 lg:col-span-2 lg:col-start-1 lg:row-start-1">
          <StudentProgressList enrollments={enrollments} courses={courses} />
          <StudentAttemptsTable
            attempts={attempts}
            courseTitles={courseTitles}
            studentName={summary.displayName}
            className={cls.name}
            classId={cls.id}
            limit={STUDENT_ATTEMPTS_LIMIT}
          />
          <StudentSubmissions submissions={submissions} />
          <StudentBadges badges={heldTiles} />
        </div>
      </div>
    </>
  );
}
