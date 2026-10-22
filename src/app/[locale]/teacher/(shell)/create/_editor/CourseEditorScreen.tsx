import { Eye } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { ContentLists } from '@/components/course-editor/ContentLists';
import { CourseDetailsForm } from '@/components/course-editor/CourseDetailsForm';
import { CourseStatusPanel } from '@/components/course-editor/CourseStatusPanel';
import { CourseEditorTabs, CourseTabProvider } from '@/components/course-editor/CourseTabs';
import { CoverImageCard } from '@/components/course-editor/CoverImageCard';
import { EditorFrame } from '@/components/course-editor/EditorFrame';
import { EditorNotices } from '@/components/course-editor/EditorNotices';
import { OutlineEditor } from '@/components/course-editor/OutlineEditor';
import { courseReadiness } from '@/components/course-editor/outline-model';
import { editorPaths, type CourseTab, type EditorMode } from '@/components/course-editor/paths';
import {
  toLessonRow,
  toModuleRow,
  toPathwayOption,
  toPlatformOption,
  toProjectRow,
  toQuizRow,
  type PathwayOption,
} from '@/components/course-editor/rows';
import { PageHeader } from '@/components/layout';
import { LinkButton } from '@/components/ui';
import { listHardwarePlatforms } from '@/lib/data/hardware';
import { listPathways } from '@/lib/data/pathways';
import { pickTranslation } from '@/lib/i18n/content';
import { loadCourseContent, loadEditorCourse } from './load';

export interface CourseEditorScreenProps {
  mode: EditorMode;
  courseId: string;
  tab: CourseTab;
}

/** The course page (7.2): status panel, outline, details, quizzes and projects. */
export async function CourseEditorScreen({ mode, courseId, tab }: CourseEditorScreenProps) {
  const { session, outline, locked } = await loadEditorCourse(mode, courseId);
  const { course, modules, lessons } = outline;
  const admin = mode === 'admin';
  const official = admin && course.isOfficial;
  const [content, platforms, pathways, locale, t, tNav] = await Promise.all([
    loadCourseContent(mode, courseId),
    listHardwarePlatforms(session),
    official
      ? listPathways(session).then((rows) => rows.map(toPathwayOption))
      : Promise.resolve<PathwayOption[]>([]),
    getLocale(),
    getTranslations('courseEditor'),
    getTranslations('nav'),
  ]);
  const paths = editorPaths(mode);
  const text = pickTranslation(course.translations, locale, course.defaultLocale);
  const moduleRows = modules.map(toModuleRow);
  const lessonRows = lessons.map(toLessonRow);
  const quizRows = content.quizzes.map(toQuizRow);
  const projectRows = content.projects.map(toProjectRow);
  const readiness = courseReadiness({
    course,
    modules: moduleRows,
    lessons: lessonRows,
    quizzes: quizRows,
    projects: projectRows,
  });
  const titles = {
    modules: Object.fromEntries(
      modules.map((row) => [row.id, pickTranslation(row.translations, locale, row.defaultLocale).title]),
    ),
    lessons: Object.fromEntries(
      lessons.map((row) => [row.id, pickTranslation(row.translations, locale, row.defaultLocale).title]),
    ),
  };
  const pathway = pathways.find((option) => option.id === course.pathwayId);
  const pathwayTitle = pathway
    ? pickTranslation(pathway.translations, locale, pathway.defaultLocale).title
    : null;
  const firstLessonId = lessons[0]?.id ?? null;

  return (
    <EditorFrame courseId={courseId}>
      <PageHeader
        title={text.title}
        description={text.summary}
        breadcrumbs={[
          { label: admin ? tNav('platform_admin.courses') : tNav('teacher.create'), href: paths.list },
          { label: text.title },
        ]}
        actions={
          firstLessonId !== null ? (
            <LinkButton href={paths.preview(courseId, firstLessonId)} variant="secondary">
              <Eye aria-hidden="true" />
              {t('course.preview')}
            </LinkButton>
          ) : undefined
        }
      />
      <CourseTabProvider initialTab={tab}>
        <div className="grid gap-8 lg:grid-cols-3">
          <aside className="flex min-w-0 flex-col gap-6 lg:col-start-3 lg:row-start-1">
            <CourseStatusPanel
              course={course}
              mode={mode}
              readiness={readiness}
              titles={titles}
              pathwayTitle={pathwayTitle}
            />
          </aside>
          <div className="flex min-w-0 flex-col gap-6 lg:col-span-2 lg:col-start-1 lg:row-start-1">
            <EditorNotices
              status={course.status}
              locked={locked}
              mode={mode}
              teacherMade={!course.isOfficial && admin}
            />
            <CourseEditorTabs
              outline={
                <OutlineEditor
                  courseId={courseId}
                  mode={mode}
                  defaultLocale={course.defaultLocale}
                  modules={moduleRows}
                  lessons={lessonRows}
                  locked={locked}
                />
              }
              details={
                <div className="flex min-w-0 flex-col gap-8">
                  <CourseDetailsForm
                    course={course}
                    mode={mode}
                    admin={admin}
                    hasProjectBlocks={lessons.some((lesson) => lesson.projectIds.length > 0)}
                    lessons={lessons.map(({ projectIds }) => ({ projectIds }))}
                    platforms={platforms.map(toPlatformOption)}
                    pathways={pathways}
                  />
                  <CoverImageCard course={course} official={official} />
                </div>
              }
              content={
                <ContentLists
                  courseId={courseId}
                  mode={mode}
                  audience={course.audience}
                  quizzes={quizRows}
                  projects={projectRows}
                  lessonTitles={titles.lessons}
                  locked={locked}
                />
              }
            />
          </div>
        </div>
      </CourseTabProvider>
    </EditorFrame>
  );
}
