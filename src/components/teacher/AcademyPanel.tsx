import { useTranslations } from 'next-intl';
import { StatusChip } from '@/components/domain';
import { Card, LinkButton, ProgressBar } from '@/components/ui';
import type { Course, Lesson } from '@/types/content';
import type { Enrollment } from '@/types/learning';
import type { AcademyPanelState, ResumeTarget } from './courses-model';
import { EnrollAcademyButton } from './EnrollAcademyButton';
import { certificatePath, editCoursePath, lessonPath } from './paths';

export interface AcademyPanelProps {
  course: Course;
  lessons: Lesson[];
  enrollment: Enrollment | null;
  state: AcademyPanelState;
  resume: ResumeTarget | null;
  accessAllowed: boolean;
  isOwner: boolean;
}

/** A Teacher Academy course for the teacher as a learner: enrol, continue, or done. */
export function AcademyPanel({
  course,
  lessons,
  enrollment,
  state,
  resume,
  accessAllowed,
  isOwner,
}: AcademyPanelProps) {
  const t = useTranslations('teacher');
  if (state === 'locked') return null;

  let body;
  if (state === 'enroll') {
    body = (
      <>
        <p className="text-sm text-ink-muted">{t('course.academyPanel.description')}</p>
        <EnrollAcademyButton courseId={course.id} />
      </>
    );
  } else if (state === 'active' && enrollment !== null) {
    const total = Math.max(enrollment.totalLessonCount, lessons.length);
    body = (
      <>
        <div className="flex flex-col gap-2">
          <ProgressBar
            value={enrollment.progressPercent}
            label={t('course.academyPanel.progress')}
            showValue
          />
          <p className="text-sm text-ink-muted">
            {t('course.academyPanel.lessons', {
              completed: enrollment.completedLessonCount,
              total,
            })}
          </p>
        </div>
        {accessAllowed && resume !== null && (
          <LinkButton href={lessonPath(course.id, resume.lessonId)} size="lg" fullWidth>
            {t(`course.academyPanel.${resume.kind}`)}
          </LinkButton>
        )}
      </>
    );
  } else if (state === 'completed' && enrollment !== null) {
    body = (
      <>
        <div className="flex flex-col items-start gap-2">
          <StatusChip status="completed" />
          <p className="font-semibold text-ink">{t('course.academyPanel.completedTitle')}</p>
          <p className="text-sm text-ink-muted">
            {t('course.academyPanel.completedDescription')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {enrollment.certificateId !== null && (
            <LinkButton href={certificatePath(enrollment.certificateId)}>
              {t('course.academyPanel.certificate')}
            </LinkButton>
          )}
          {accessAllowed && lessons[0] !== undefined && (
            <LinkButton href={lessonPath(course.id, lessons[0].id)} variant="secondary">
              {t('course.academyPanel.review')}
            </LinkButton>
          )}
        </div>
      </>
    );
  } else {
    body = (
      <>
        <p className="text-sm text-ink-muted">{t('course.academyPanel.draft')}</p>
        {isOwner && (
          <div>
            <LinkButton href={editCoursePath(course.id)} variant="secondary">
              {t('course.edit')}
            </LinkButton>
          </div>
        )}
      </>
    );
  }

  return (
    <Card tone="brand" as="section" aria-labelledby="academy-panel-title" className="gap-4 p-5 sm:p-6">
      <h2
        id="academy-panel-title"
        tabIndex={-1}
        className="rounded-sm text-lg leading-snug font-bold text-ink"
      >
        {t('course.academyPanel.title')}
      </h2>
      {body}
    </Card>
  );
}
