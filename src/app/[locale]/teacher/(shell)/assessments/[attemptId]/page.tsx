import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { assessmentsHref } from '@/components/quiz/assessments-model';
import { AttemptReview } from '@/components/quiz/AttemptReview';
import { reviewRows } from '@/components/quiz/quiz-model';
import { Alert, LinkButton } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { getClass } from '@/lib/data/classes';
import { getCourses } from '@/lib/data/courses';
import { getAttempt, getQuiz } from '@/lib/data/quizzes';
import { isAppError } from '@/lib/errors';
import { pickTranslation } from '@/lib/i18n/content';
import type { QuizAttempt } from '@/types/quiz';
import { AttemptOverview } from './_components/AttemptOverview';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('assessments');
  return { title: t('detail.metaTitle') };
}

/** A read the teacher may not make (hidden or gone) answers null; real faults still throw. */
async function hiddenAsNull<T>(read: Promise<T>): Promise<T | null> {
  try {
    return await read;
  } catch (error) {
    if (isAppError(error) && (error.code === 'not_found' || error.code === 'forbidden')) {
      return null;
    }
    throw error;
  }
}

// One attempt, question by question (ARCHITECTURE.md 6.5): direct gets only (3.7). The answer
// key is never read: each answer is marked correct or incorrect, the right ones are not shown.
export default async function TeacherAttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const session = await requireRole('teacher');
  const { attemptId } = await params;
  let attempt: QuizAttempt;
  try {
    attempt = await getAttempt(session, attemptId);
  } catch (error) {
    if (isAppError(error) && (error.code === 'not_found' || error.code === 'forbidden')) {
      notFound();
    }
    throw error;
  }
  // Class results only: the teacher's own Teacher Academy attempts are not listed here.
  const classId = attempt.classId;
  if (classId === null || attempt.userUid === session.uid) notFound();

  const [quiz, courses, cls, locale, t, tNav, tCommon] = await Promise.all([
    hiddenAsNull(getQuiz(session, attempt.courseId, attempt.quizId)),
    getCourses(session, [attempt.courseId]),
    hiddenAsNull(getClass(session, classId)),
    getLocale(),
    getTranslations('assessments'),
    getTranslations('nav'),
    getTranslations('common'),
  ]);

  const rows = reviewRows({ quiz, attempt, correctOptionIds: null, explanations: null, locale });
  const course = courses.at(0);
  const courseTitle = course
    ? pickTranslation(course.translations, locale, course.defaultLocale).title
    : t('list.unknownCourse');
  const quizTitle = pickTranslation(attempt.quizTitle, locale, quiz?.defaultLocale ?? 'en').title;
  const listHref = assessmentsHref({ classId, courseId: attempt.courseId });
  const languageName = tCommon(`locale.names.${attempt.locale}`);

  return (
    <>
      <PageHeader
        title={t('detail.title', { name: attempt.studentName, quiz: quizTitle })}
        description={
          cls === null
            ? t('detail.contextCourse', { course: courseTitle })
            : t('detail.context', { course: courseTitle, className: cls.name })
        }
        breadcrumbs={[
          { label: tNav('teacher.assessments'), href: listHref },
          { label: t('detail.breadcrumb', { number: attempt.attemptNumber }) },
        ]}
        actions={
          <LinkButton
            href={`/teacher/classes/${classId}/students/${attempt.userUid}`}
            variant="secondary"
            size="sm"
          >
            {t('detail.studentLink', { name: attempt.studentName })}
          </LinkButton>
        }
      />
      <AttemptOverview attempt={attempt} languageName={languageName} />
      <section aria-labelledby="attempt-questions" className="mt-8 flex max-w-3xl flex-col gap-4">
        <h2 id="attempt-questions" className="text-xl font-semibold text-ink">
          {t('detail.questions')}
        </h2>
        <Alert tone="info" live="off">
          {quiz === null ? t('detail.quizUnavailable') : t('detail.keyNote')}
        </Alert>
        <AttemptReview rows={rows} perspective="teacher" headingAs="h3" />
      </section>
      <div className="mt-6">
        <LinkButton href={listHref} variant="ghost">
          <ChevronLeft aria-hidden="true" className="rtl:rotate-180" />
          {t('detail.backToList')}
        </LinkButton>
      </div>
    </>
  );
}
