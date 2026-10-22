import { Eye } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { BlockList } from '@/components/course-editor/BlockList';
import { EditorFrame } from '@/components/course-editor/EditorFrame';
import { EditorNotices } from '@/components/course-editor/EditorNotices';
import { LessonDetailsForm } from '@/components/course-editor/LessonDetailsForm';
import { LessonRequirements } from '@/components/course-editor/LessonRequirements';
import { lessonRequirements } from '@/components/course-editor/outline-model';
import { anchors, editorPaths, type EditorMode } from '@/components/course-editor/paths';
import { toLessonRow, toProjectRow, toQuizRow } from '@/components/course-editor/rows';
import { PageHeader } from '@/components/layout';
import { LinkButton } from '@/components/ui';
import { listBlocks } from '@/lib/data/courses';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import { loadCourseContent, loadEditorCourse } from './load';

export interface LessonEditorScreenProps {
  mode: EditorMode;
  courseId: string;
  lessonId: string;
}

/** The lesson page (7.3): the blocks by stage, the lesson's details and requirements. */
export async function LessonEditorScreen({ mode, courseId, lessonId }: LessonEditorScreenProps) {
  const { session, outline, locked } = await loadEditorCourse(mode, courseId);
  const { course } = outline;
  const lesson = outline.lessons.find((candidate) => candidate.id === lessonId);
  if (lesson === undefined) notFound();
  const courseModule = outline.modules.find((candidate) => candidate.id === lesson.moduleId);
  const admin = mode === 'admin';
  const [blocks, content, locale, t, tNav] = await Promise.all([
    listBlocks(session, courseId, lessonId),
    loadCourseContent(mode, courseId),
    getLocale(),
    getTranslations('courseEditor'),
    getTranslations('nav'),
  ]);
  const paths = editorPaths(mode);
  const courseTitle = pickTranslation(course.translations, locale, course.defaultLocale).title;
  const text = pickTranslation(lesson.translations, locale, lesson.defaultLocale);
  const moduleTitle = courseModule
    ? pickTranslation(courseModule.translations, locale, courseModule.defaultLocale).title
    : '';

  return (
    <EditorFrame courseId={courseId}>
      <PageHeader
        title={text.title}
        description={text.summary}
        breadcrumbs={[
          { label: admin ? tNav('platform_admin.courses') : tNav('teacher.create'), href: paths.list },
          { label: courseTitle, href: paths.course(courseId) },
          { label: text.title },
        ]}
        actions={
          <LinkButton href={paths.preview(courseId, lessonId)} variant="secondary">
            <Eye aria-hidden="true" />
            {t('lessonEditor.preview')}
          </LinkButton>
        }
      />
      <div className="flex flex-col gap-8">
        <EditorNotices
          status={course.status}
          locked={locked}
          mode={mode}
          teacherMade={!course.isOfficial && admin}
        />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <BlockList
              courseId={courseId}
              mode={mode}
              lessonId={lessonId}
              lessonTitle={text.title}
              audience={course.audience}
              defaultLocale={course.defaultLocale}
              official={admin && course.isOfficial}
              blocks={blocks}
              quizzes={content.quizzes.map(toQuizRow)}
              projects={content.projects.map(toProjectRow)}
              locked={locked}
            />
          </div>
          <aside className="flex min-w-0 flex-col gap-6">
            <LessonDetailsForm courseId={courseId} lesson={toLessonRow(lesson)} />
            <LessonRequirements requirements={lessonRequirements(lesson, blocks)} />
            {courseModule && (
              <p className="text-sm text-ink-muted">
                <Link
                  href={`${paths.course(courseId)}#${anchors.module(courseModule.id)}`}
                  className="rounded-sm underline-offset-4 hover:text-ink hover:underline"
                >
                  {t('lessonEditor.moduleOf', { module: moduleTitle })}
                </Link>
              </p>
            )}
          </aside>
        </div>
      </div>
    </EditorFrame>
  );
}
