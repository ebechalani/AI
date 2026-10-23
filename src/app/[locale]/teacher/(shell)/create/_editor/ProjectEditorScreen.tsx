import { Eye } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { DeleteContentButton } from '@/components/course-editor/DeleteContentButton';
import { EditorFrame } from '@/components/course-editor/EditorFrame';
import { EditorNotices } from '@/components/course-editor/EditorNotices';
import { editorPaths, NEW_ID, type EditorMode } from '@/components/course-editor/paths';
import { ProjectEditor } from '@/components/course-editor/ProjectEditor';
import { PageHeader } from '@/components/layout';
import { Alert, LinkButton } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import { loadEditorCourse, loadProject } from './load';

export interface ProjectEditorScreenProps {
  mode: EditorMode;
  courseId: string;
  /** A project id, or `new`. */
  projectId: string;
  lessonParam: string | undefined;
}

/** The project page (7.5). */
export async function ProjectEditorScreen({
  mode,
  courseId,
  projectId,
  lessonParam,
}: ProjectEditorScreenProps) {
  const { outline, locked } = await loadEditorCourse(mode, courseId);
  const { course } = outline;
  const creating = projectId === NEW_ID;
  const [project, locale, t, tNav] = await Promise.all([
    creating ? Promise.resolve(null) : loadProject(mode, courseId, projectId),
    getLocale(),
    getTranslations('courseEditor'),
    getTranslations('nav'),
  ]);
  const admin = mode === 'admin';
  const paths = editorPaths(mode);
  const teacherCourse = course.audience === 'teacher';
  const lessonTitle = (id: string) => {
    const lesson = outline.lessons.find((candidate) => candidate.id === id);
    return lesson ? pickTranslation(lesson.translations, locale, lesson.defaultLocale).title : null;
  };
  const courseTitle = pickTranslation(course.translations, locale, course.defaultLocale).title;
  const title = project
    ? pickTranslation(project.translations, locale, project.defaultLocale).title
    : t('project.newTitle');
  const linkedLesson =
    project?.lessonId && lessonTitle(project.lessonId) !== null
      ? { id: project.lessonId, title: lessonTitle(project.lessonId) ?? '' }
      : null;
  // A project block cannot be added to a course for teachers.
  const addToTitle =
    creating && !teacherCourse && lessonParam !== undefined ? lessonTitle(lessonParam) : null;
  const addTo =
    addToTitle !== null && lessonParam !== undefined
      ? {
          lessonId: lessonParam,
          title: addToTitle,
          blockCount: outline.lessons.find((candidate) => candidate.id === lessonParam)?.blockCount ?? 0,
        }
      : null;

  return (
    <EditorFrame courseId={courseId}>
      <PageHeader
        title={title}
        breadcrumbs={[
          { label: admin ? tNav('platform_admin.courses') : tNav('teacher.create'), href: paths.list },
          { label: courseTitle, href: paths.course(courseId, 'content') },
          { label: title },
        ]}
        actions={
          <>
            {linkedLesson && (
              <LinkButton href={paths.preview(courseId, linkedLesson.id)} variant="secondary">
                <Eye aria-hidden="true" />
                {t('project.previewLesson')}
              </LinkButton>
            )}
            {project && !linkedLesson && !locked && (
              <DeleteContentButton
                kind="project"
                courseId={courseId}
                id={project.id}
                title={title}
                linked={false}
                navigateTo={paths.course(courseId, 'content')}
              />
            )}
          </>
        }
      />
      <div className="flex max-w-4xl flex-col gap-6">
        <EditorNotices
          status={course.status}
          locked={locked}
          mode={mode}
          teacherMade={!course.isOfficial && admin}
        />
        {linkedLesson && (
          <Alert
            tone="info"
            live="off"
            action={
              <Link
                href={paths.lesson(courseId, linkedLesson.id)}
                className="rounded-sm text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-800"
              >
                {t('readiness.open.lesson')}
              </Link>
            }
          >
            {t('project.linkedTo', { lesson: linkedLesson.title })}
          </Alert>
        )}
        {addTo && (
          <Alert tone="info" live="off">
            {t('project.willBeAdded', { lesson: addTo.title })}
          </Alert>
        )}
        <ProjectEditor
          courseId={courseId}
          mode={mode}
          projectId={project?.id ?? null}
          project={project}
          defaultLocale={project?.defaultLocale ?? course.defaultLocale}
          addTo={addTo}
          teacherCourse={teacherCourse}
        />
      </div>
    </EditorFrame>
  );
}
