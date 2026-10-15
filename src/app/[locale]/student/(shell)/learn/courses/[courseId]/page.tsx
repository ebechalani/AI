import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CircleCheck } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { requireRole } from '@/lib/auth/session';
import { getPublishedCourse } from '@/lib/data/courses';
import { getEnrollment } from '@/lib/data/enrollments';
import { isAppError } from '@/lib/errors';
import { pickTranslation } from '@/lib/i18n/content';
import { getCourseAccess } from '@/lib/services/access';
import type { CourseOutline } from '@/types/content';
import { CourseFacts } from './_components/CourseFacts';
import { forbiddenCourseView, lessonStates, resumeLesson } from './_components/course-model';
import { CourseOutlineList } from './_components/CourseOutlineList';
import { CourseUnavailable } from './_components/CourseUnavailable';
import { EnrollPanel } from './_components/EnrollPanel';
import { loadOutline } from './_components/load';

type Params = Promise<{ courseId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { courseId } = await params;
  const tNav = await getTranslations('nav');
  try {
    const { course } = await loadOutline(courseId);
    const text = pickTranslation(course.translations, await getLocale(), course.defaultLocale);
    return { title: text.title, description: text.summary };
  } catch (error) {
    if (isAppError(error)) return { title: tNav('student.learn') };
    throw error;
  }
}

/** The outline, or the page a hidden course gets; not found for a missing or malformed id. */
async function outlineOrView(courseId: string) {
  try {
    return { outline: await loadOutline(courseId) };
  } catch (error) {
    if (!isAppError(error)) throw error;
    if (error.code === 'not_found') notFound();
    if (error.code !== 'forbidden') throw error;
    // ARCHITECTURE.md 4.4: a hidden course is forbidden. Only a published official course can
    // be named here, so the student learns why a Teacher Academy course does not open.
    const published = await getPublishedCourse(courseId);
    return { forbidden: published };
  }
}

// Course detail for enrolled and unenrolled students alike (ARCHITECTURE.md 6.4): facts, the
// enrol / continue panel and the outline.
export default async function StudentCoursePage({ params }: { params: Params }) {
  const session = await requireRole('student');
  const { courseId } = await params;
  const [result, locale, t, tNav] = await Promise.all([
    outlineOrView(courseId),
    getLocale(),
    getTranslations('learn'),
    getTranslations('nav'),
  ]);

  if (!('outline' in result)) {
    const published = result.forbidden;
    const title = published
      ? pickTranslation(published.translations, locale, published.defaultLocale).title
      : null;
    return <CourseUnavailable view={forbiddenCourseView(published)} title={title} />;
  }

  const { course, modules, lessons }: CourseOutline = result.outline;
  const [enrollment, access] = await Promise.all([
    getEnrollment(session, session.uid, courseId),
    getCourseAccess(session, course),
  ]);
  const resume = resumeLesson(lessons, enrollment);
  const states = lessonStates(lessons, enrollment, resume);
  const locked = !access.allowed;
  const text = pickTranslation(course.translations, locale, course.defaultLocale);
  const outcomes = (text.outcomes ?? []).filter((outcome) => outcome.trim() !== '');

  return (
    <>
      <PageHeader
        title={text.title}
        description={text.summary || undefined}
        breadcrumbs={[{ label: tNav('student.learn'), href: '/student/learn' }, { label: text.title }]}
      />
      {/* The panel comes first in the DOM, so on phones it sits right under the header. */}
      <div className="grid gap-8 lg:grid-cols-3">
        <aside className="flex min-w-0 flex-col gap-6 lg:col-start-3 lg:row-start-1">
          <EnrollPanel
            courseId={course.id}
            enrollment={enrollment}
            resume={resume}
            access={access.allowed ? 'allowed' : 'license_required'}
            lessonCount={lessons.length}
          />
          <CourseFacts course={course} lessonCount={lessons.length} moduleCount={modules.length} />
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
          <CourseOutlineList
            courseId={course.id}
            modules={modules}
            lessons={lessons}
            states={states}
            locked={locked}
            enrolled={enrollment !== null}
          />
        </div>
      </div>
    </>
  );
}
