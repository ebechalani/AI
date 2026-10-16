import { useLocale, useTranslations } from 'next-intl';
import { AssignCourseDialog } from '@/components/classes/AssignCourseDialog';
import { Card, Chip, LinkButton } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import type { Course } from '@/types/content';
import type { SchoolClass } from '@/types/school';
import type { AssignPanelState } from './courses-model';
import { classPath, editCoursePath, TEACHER_PATHS } from './paths';

export interface AssignToClassPanelProps {
  course: Course;
  /** The teacher's active classes, by name. */
  classes: SchoolClass[];
  state: AssignPanelState;
  isOwner: boolean;
}

/** The teacher's classes, each with "Assign" or "Assigned". */
export function AssignToClassPanel({ course, classes, state, isOwner }: AssignToClassPanelProps) {
  const t = useTranslations('teacher');
  const locale = useLocale();
  if (state === 'locked') return null;
  const title = pickTranslation(course.translations, locale, course.defaultLocale).title;

  let body;
  if (state === 'notPublished') {
    body = (
      <>
        <p className="text-sm text-ink-muted">{t('course.assignPanel.notPublished')}</p>
        {isOwner && (
          <div>
            <LinkButton href={editCoursePath(course.id)} variant="secondary">
              {t('course.edit')}
            </LinkButton>
          </div>
        )}
      </>
    );
  } else if (state === 'noClasses') {
    body = (
      <>
        <p className="text-sm text-ink-muted">{t('course.assignPanel.noClasses.description')}</p>
        <div>
          <LinkButton href={TEACHER_PATHS.classes} variant="secondary">
            {t('course.assignPanel.noClasses.action')}
          </LinkButton>
        </div>
      </>
    );
  } else {
    body = (
      <ul className="divide-y divide-border">
        {classes.map((cls) => {
          const linkId = `assign-class-${cls.id}`;
          return (
            <li key={cls.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <Link
                id={linkId}
                href={classPath(cls.id)}
                className="min-w-0 rounded-sm font-medium break-words text-ink underline-offset-4 hover:text-brand-700 hover:underline"
              >
                {cls.name}
              </Link>
              {cls.assignedCourseIds.includes(course.id) ? (
                <Chip tone="success">{t('course.assignPanel.assigned')}</Chip>
              ) : (
                <AssignCourseDialog
                  classId={cls.id}
                  className={cls.name}
                  courseId={course.id}
                  courseTitle={title}
                  mode="assign"
                  currentDueAt={null}
                  triggerLabel={t('course.assignPanel.assign')}
                  triggerAriaLabel={t('course.assignPanel.actionLabel', { className: cls.name })}
                  triggerVariant="secondary"
                  focusAfterSuccessId={linkId}
                />
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <Card as="section" aria-labelledby="assign-panel-title" className="gap-3 p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 id="assign-panel-title" className="text-lg leading-snug font-bold text-ink">
          {t('course.assignPanel.title')}
        </h2>
        <p className="text-sm text-ink-muted">{t('course.assignPanel.description')}</p>
      </div>
      {body}
    </Card>
  );
}
