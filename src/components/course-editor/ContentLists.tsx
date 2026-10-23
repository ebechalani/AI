import { ListChecks, NotebookPen } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, Chip, EmptyState, LinkButton } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import type { Audience } from '@/types/common';
import { DeleteContentButton } from './DeleteContentButton';
import { CONTENT_ANCHOR, editorPaths, type EditorMode } from './paths';
import type { ProjectRow, QuizRow } from './rows';

export interface ContentListsProps {
  courseId: string;
  mode: EditorMode;
  audience: Audience;
  quizzes: QuizRow[];
  projects: ProjectRow[];
  /** Lesson titles in the UI language, by lesson id. */
  lessonTitles: Record<string, string>;
  locked: boolean;
}

const LINK = 'rounded-sm font-semibold break-words text-ink underline-offset-4 hover:text-brand-700 hover:underline';
const META = 'flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted';

/** The course's quizzes and projects (6.2.6): where each is used, and the unused ones' delete. */
export function ContentLists({
  courseId,
  mode,
  audience,
  quizzes,
  projects,
  lessonTitles,
  locked,
}: ContentListsProps) {
  const t = useTranslations('courseEditor');
  const locale = useLocale();
  const paths = editorPaths(mode);
  const teacherCourse = audience === 'teacher';

  function usage(lessonId: string | null) {
    return lessonId === null ? (
      <Chip tone="warning">{t('content.unused')}</Chip>
    ) : (
      <span>
        {t('content.usedIn', { lesson: lessonTitles[lessonId] ?? '' })}{' '}
        <Link href={paths.lesson(courseId, lessonId)} className="rounded-sm text-brand-700 underline underline-offset-4 hover:text-brand-800">
          {t('readiness.open.lesson')}
        </Link>
      </span>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <section aria-labelledby={CONTENT_ANCHOR} className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id={CONTENT_ANCHOR} tabIndex={-1} className="rounded-sm text-xl font-bold text-ink">
            {t('content.quizzesTitle')}
          </h2>
          <LinkButton href={paths.newQuiz(courseId)} size="sm">
            {t('content.newQuiz')}
          </LinkButton>
        </div>
        {quizzes.length === 0 ? (
          <EmptyState
            variant="plain"
            icon={<ListChecks />}
            titleAs="h3"
            title={t('content.noQuizzes')}
            description={t('content.noQuizzesDescription')}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {quizzes.map((quiz) => {
              const title = pickTranslation(quiz.translations, locale, quiz.defaultLocale).title;
              return (
                <Card as="li" key={quiz.id} className="flex-row flex-wrap items-center gap-3 p-4">
                  <div className="flex min-w-0 flex-1 basis-56 flex-col gap-1">
                    <h3 className="text-base leading-snug">
                      <Link href={paths.quiz(courseId, quiz.id)} className={LINK}>
                        {title}
                      </Link>
                    </h3>
                    <div className={META}>
                      <span>{t('content.questionCount', { count: quiz.questionCount })}</span>
                      {usage(quiz.lessonId)}
                    </div>
                  </div>
                  {quiz.lessonId === null && !locked && (
                    <DeleteContentButton
                      kind="quiz"
                      courseId={courseId}
                      id={quiz.id}
                      title={title}
                      linked={false}
                    />
                  )}
                </Card>
              );
            })}
          </ul>
        )}
      </section>
      <section aria-labelledby={`${CONTENT_ANCHOR}-projects`} className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id={`${CONTENT_ANCHOR}-projects`} className="text-xl font-bold text-ink">
            {t('content.projectsTitle')}
          </h2>
          {!teacherCourse && (
            <LinkButton href={paths.newProject(courseId)} size="sm">
              {t('content.newProject')}
            </LinkButton>
          )}
        </div>
        {teacherCourse && <p className="text-sm text-ink-muted">{t('content.noProjectsForTeachers')}</p>}
        {projects.length === 0 ? (
          teacherCourse ? null : (
            <EmptyState
              variant="plain"
              icon={<NotebookPen />}
              titleAs="h3"
              title={t('content.noProjects')}
              description={t('content.noProjectsDescription')}
            />
          )
        ) : (
          <ul className="flex flex-col gap-3">
            {projects.map((project) => {
              const title = pickTranslation(project.translations, locale, project.defaultLocale).title;
              return (
                <Card as="li" key={project.id} className="flex-row flex-wrap items-center gap-3 p-4">
                  <div className="flex min-w-0 flex-1 basis-56 flex-col gap-1">
                    <h3 className="text-base leading-snug">
                      <Link href={paths.project(courseId, project.id)} className={LINK}>
                        {title}
                      </Link>
                    </h3>
                    <div className={META}>
                      <span>{t(`project.kinds.${project.kind}`)}</span>
                      {usage(project.lessonId)}
                    </div>
                  </div>
                  {project.lessonId === null && !locked && (
                    <DeleteContentButton
                      kind="project"
                      courseId={courseId}
                      id={project.id}
                      title={title}
                      linked={false}
                    />
                  )}
                </Card>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
