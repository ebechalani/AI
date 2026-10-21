import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CircleCheck, Eye, SquarePen } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { AcademyPanel } from '@/components/teacher/AcademyPanel';
import { AssignToClassPanel } from '@/components/teacher/AssignToClassPanel';
import { CourseFacts } from '@/components/teacher/CourseFacts';
import { CourseOutline } from '@/components/teacher/CourseOutline';
import {
  academyPanelState,
  assignPanelState,
  lessonStates,
  resumeLesson,
} from '@/components/teacher/courses-model';
import { coursesPath, editCoursePath, lessonPath } from '@/components/teacher/paths';
import { Alert, LinkButton } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { listClassesForTeacher } from '@/lib/data/classes';
import { getEnrollment } from '@/lib/data/enrollments';
import { isAppError } from '@/lib/errors';
import { pickTranslation } from '@/lib/i18n/content';
import { getCourseAccess } from '@/lib/services/access';
import type { CourseOutline as Outline } from '@/types/content';
import type { Enrollment } from '@/types/learning';
import type { SchoolClass } from '@/types/school';
import { loadOutline } from './_lib/load';

type Params = Promise<{ courseId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  await requireRole('teacher');
  const { courseId } = await params;
  try {
    const { course } = await loadOutline(courseId);
    const text = pickTranslation(course.translations, await getLocale(), course.defaultLocale);
    return { title: text.title, description: text.summary || undefined };
  } catch (error) {
    if (!isAppError(error)) throw error;
    const tNav = await getTranslations('nav');
    return { title: tNav('teacher.courses') };
  }
}

async function outlineOrNotFound(courseId: string): Promise<Outline> {
  try {
    return await loadOutline(courseId);
  } catch (error) {
    if (isAppError(error) && (error.code === 'not_found' || error.code === 'forbidden')) {
      notFound();
    }
    throw error;
  }
}

// One course for a teacher (ARCHITECTURE.md 6.5, 3.7 "Teacher course detail" with WS-E-1): a
// student course to preview and assign, or a Teacher Academy course to learn.
export default async function TeacherCoursePage({ params }: { params: Params }) {
  const session = await requireRole('teacher');
  const { courseId } = await params;
  const { course, modules, lessons } = await outlineOrNotFound(courseId);
  const isTeacherCourse = course.audience === 'teacher';
  const [access, enrollment, classes, locale, t, tNav] = await Promise.all([
    getCourseAccess(session, course),
    isTeacherCourse
      ? getEnrollment(session, session.uid, course.id)
      : Promise.resolve<Enrollment | null>(null),
    isTeacherCourse
      ? Promise.resolve<SchoolClass[]>([])
      : listClassesForTeacher(session, session.uid),
    getLocale(),
    getTranslations('teacher'),
    getTranslations('nav'),
  ]);
  const allowed = access.allowed;
  const isOwner = course.ownerUid === session.uid && !course.isOfficial;
  const resume = isTeacherCourse ? resumeLesson(lessons, enrollment) : null;
  const states =
    isTeacherCourse && enrollment !== null ? lessonStates(lessons, enrollment, resume) : null;
  const text = pickTranslation(course.translations, locale, course.defaultLocale);
  const outcomes = (text.outcomes ?? []).filter((outcome) => outcome.trim() !== '');
  const firstLesson = lessons[0];

  return (
    <>
      <PageHeader
        title={text.title}
        description={text.summary || undefined}
        breadcrumbs={[
          {
            label: tNav('teacher.courses'),
            href: coursesPath(isTeacherCourse ? 'academy' : undefined),
          },
          { label: text.title },
        ]}
        actions={
          <>
            {allowed && firstLesson !== undefined && !(isTeacherCourse && enrollment) && (
              <LinkButton href={lessonPath(course.id, firstLesson.id)} variant="secondary">
                <Eye aria-hidden="true" />
                {t('course.preview')}
              </LinkButton>
            )}
            {isOwner && (
              <LinkButton href={editCoursePath(course.id)} variant="secondary">
                <SquarePen aria-hidden="true" />
                {t('course.edit')}
              </LinkButton>
            )}
          </>
        }
      />
      <div className="grid gap-8 lg:grid-cols-3">
        {/* First in the DOM: on phones the panel sits right under the header. */}
        <aside className="flex min-w-0 flex-col gap-6 lg:col-start-3 lg:row-start-1">
          {!allowed && (
            <Alert tone="warning" live="off" title={t('course.license.title')}>
              {t('course.license.description')}
            </Alert>
          )}
          {isTeacherCourse ? (
            <AcademyPanel
              course={course}
              lessons={lessons}
              enrollment={enrollment}
              state={academyPanelState(course, enrollment, allowed)}
              resume={resume}
              accessAllowed={allowed}
              isOwner={isOwner}
            />
          ) : (
            <AssignToClassPanel
              course={course}
              classes={classes}
              state={assignPanelState(course, allowed, classes.length)}
              isOwner={isOwner}
            />
          )}
          <CourseFacts
            course={course}
            lessonCount={lessons.length}
            moduleCount={modules.length}
            isOwner={isOwner}
          />
        </aside>
        <div className="flex min-w-0 flex-col gap-8 lg:col-span-2 lg:col-start-1 lg:row-start-1">
          {text.description && (
            <section aria-labelledby="course-about" className="flex flex-col gap-3">
              <h2 id="course-about" className="text-xl font-bold text-ink">
                {t('course.about')}
              </h2>
              <p className="text-base break-words whitespace-pre-line text-ink-muted">
                {text.description}
              </p>
            </section>
          )}
          {outcomes.length > 0 && (
            <section aria-labelledby="course-outcomes" className="flex flex-col gap-3">
              <h2 id="course-outcomes" className="text-xl font-bold text-ink">
                {t('course.outcomes')}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {outcomes.map((outcome, index) => (
                  <li key={index} className="flex items-start gap-2 text-base text-ink">
                    <CircleCheck
                      aria-hidden="true"
                      className="mt-0.5 size-5 shrink-0 text-success"
                    />
                    <span className="min-w-0 break-words">{outcome}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <CourseOutline
            courseId={course.id}
            modules={modules}
            lessons={lessons}
            states={states}
            linked={allowed}
          />
        </div>
      </div>
    </>
  );
}
