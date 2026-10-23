import { useLocale, useTranslations } from 'next-intl';
import { MediaImage, StatusChip, useDateFormat } from '@/components/domain';
import { Card, Chip, LinkButton } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import type { Course } from '@/types/content';
import { editorPaths, type EditorMode } from './paths';
import type { PathwayOption } from './rows';

export interface CourseListProps {
  courses: Course[];
  mode: EditorMode;
  /** Admin mode: to name each course's pathway. */
  pathways?: PathwayOption[];
}

/** The authored (teacher) or official (admin) courses, one row each, latest change first. */
export function CourseList({ courses, mode, pathways = [] }: CourseListProps) {
  const t = useTranslations('courseEditor');
  const locale = useLocale();
  const formatDate = useDateFormat();
  const paths = editorPaths(mode);

  function pathwayTitle(pathwayId: string | null): string | null {
    const pathway = pathways.find((option) => option.id === pathwayId);
    return pathway ? pickTranslation(pathway.translations, locale, pathway.defaultLocale).title : null;
  }

  return (
    <ul className="flex flex-col gap-3">
      {courses.map((course) => {
        const title = pickTranslation(course.translations, locale, course.defaultLocale).title;
        const pathway = mode === 'admin' ? pathwayTitle(course.pathwayId) : null;
        return (
          <Card
            as="li"
            key={course.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-3">
              {course.coverImage && (
                <MediaImage
                  media={course.coverImage}
                  alt=""
                  frame="16:9"
                  sizes="64px"
                  className="mt-0.5 w-16 shrink-0 rounded-md"
                />
              )}
              <div className="flex min-w-0 flex-col gap-1.5">
                <h3 className="text-base leading-snug font-semibold break-words text-ink">
                  <Link
                    href={paths.course(course.id)}
                    className="rounded-sm underline-offset-4 hover:text-brand-700 hover:underline"
                  >
                    {title}
                  </Link>
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
                  <StatusChip status={course.status} />
                  <span>{t(`list.audience.${course.audience}`)}</span>
                  {mode === 'teacher' ? (
                    <span>
                      {t(`list.visibility.${course.visibility === 'school' ? 'school' : 'private'}`)}
                    </span>
                  ) : (
                    <>
                      <span className="break-words">
                        {pathway === null ? t('adminList.noPathway') : t('adminList.pathway', { pathway })}
                      </span>
                      {course.accessTier === 'premium' && (
                        <Chip tone="accent">{t('adminList.tier.premium')}</Chip>
                      )}
                    </>
                  )}
                  <span>
                    {t('list.structure', { modules: course.moduleCount, lessons: course.lessonCount })}
                  </span>
                  <span>{t('list.updated', { date: formatDate(course.updatedAt) })}</span>
                </div>
              </div>
            </div>
            <div className="shrink-0">
              <LinkButton
                href={paths.course(course.id)}
                size="sm"
                variant="secondary"
                aria-label={t('list.editLabel', { course: title })}
              >
                {t('list.edit')}
              </LinkButton>
            </div>
          </Card>
        );
      })}
    </ul>
  );
}
