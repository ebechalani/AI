import { Eye } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { DeleteContentButton } from '@/components/course-editor/DeleteContentButton';
import { EditorFrame } from '@/components/course-editor/EditorFrame';
import { EditorNotices } from '@/components/course-editor/EditorNotices';
import { editorPaths, NEW_ID, type EditorMode } from '@/components/course-editor/paths';
import { QuizEditor } from '@/components/course-editor/QuizEditor';
import { PageHeader } from '@/components/layout';
import { Alert, LinkButton } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import { loadEditorCourse, loadQuiz, loadTrueFalseTexts } from './load';

export interface QuizEditorScreenProps {
  mode: EditorMode;
  courseId: string;
  /** A quiz id, or `new`. */
  quizId: string;
  /** `?lesson=`: the lesson a new quiz is added to. */
  lessonParam: string | undefined;
}

/** The quiz page (7.4). */
export async function QuizEditorScreen({ mode, courseId, quizId, lessonParam }: QuizEditorScreenProps) {
  const { outline, locked } = await loadEditorCourse(mode, courseId);
  const { course } = outline;
  const creating = quizId === NEW_ID;
  const [loaded, tf, locale, t, tNav] = await Promise.all([
    creating ? Promise.resolve(null) : loadQuiz(mode, courseId, quizId),
    loadTrueFalseTexts(),
    getLocale(),
    getTranslations('courseEditor'),
    getTranslations('nav'),
  ]);
  const admin = mode === 'admin';
  const paths = editorPaths(mode);
  const lessonTitle = (id: string) => {
    const lesson = outline.lessons.find((candidate) => candidate.id === id);
    return lesson ? pickTranslation(lesson.translations, locale, lesson.defaultLocale).title : null;
  };
  const courseTitle = pickTranslation(course.translations, locale, course.defaultLocale).title;
  const quiz = loaded?.quiz ?? null;
  const title = quiz
    ? pickTranslation(quiz.translations, locale, quiz.defaultLocale).title
    : t('quiz.newTitle');
  const linkedLesson =
    quiz?.lessonId && lessonTitle(quiz.lessonId) !== null
      ? { id: quiz.lessonId, title: lessonTitle(quiz.lessonId) ?? '' }
      : null;
  const addToTitle = creating && lessonParam !== undefined ? lessonTitle(lessonParam) : null;
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
                {t('quiz.previewLesson')}
              </LinkButton>
            )}
            {quiz && !linkedLesson && !locked && (
              <DeleteContentButton
                kind="quiz"
                courseId={courseId}
                id={quiz.id}
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
          quiz
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
            {t('quiz.linkedTo', { lesson: linkedLesson.title })}
          </Alert>
        )}
        {addTo && (
          <Alert tone="info" live="off">
            {t('quiz.willBeAdded', { lesson: addTo.title })}
          </Alert>
        )}
        <QuizEditor
          courseId={courseId}
          mode={mode}
          quizId={quiz?.id ?? null}
          input={loaded?.input ?? null}
          defaultLocale={quiz?.defaultLocale ?? course.defaultLocale}
          tf={tf}
          addTo={addTo}
        />
      </div>
    </EditorFrame>
  );
}
