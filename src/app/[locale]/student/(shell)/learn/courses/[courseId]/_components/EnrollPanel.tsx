import { Award, CirclePlay, RotateCcw, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StatusChip } from '@/components/domain';
import { Alert, Card, Chip, LinkButton, ProgressBar } from '@/components/ui';
import type { Enrollment } from '@/types/learning';
import { lessonHref, type ResumeTarget } from './course-model';
import { EnrollButton } from './EnrollButton';

export interface EnrollPanelProps {
  courseId: string;
  enrollment: Enrollment | null;
  resume: ResumeTarget | null;
  access: 'allowed' | 'license_required';
  lessonCount: number;
}

const TITLE = 'text-lg leading-snug font-bold text-ink';

function FromClassChip({ enrollment }: { enrollment: Enrollment }) {
  const t = useTranslations('learn');
  if (enrollment.source !== 'class') return null;
  return (
    <Chip tone="accent" icon={<Users aria-hidden="true" />} className="self-start">
      {t('course.progress.fromClass')}
    </Chip>
  );
}

/** The resume button: start, continue or review, to the lesson `resumeLesson` picked. */
function ResumeLink({
  courseId,
  resume,
  variant,
}: {
  courseId: string;
  resume: ResumeTarget;
  variant: 'primary' | 'secondary';
}) {
  const t = useTranslations('learn');
  return (
    <LinkButton href={lessonHref(courseId, resume.lessonId)} variant={variant} size="lg" fullWidth>
      {resume.kind === 'review' ? (
        <RotateCcw aria-hidden="true" />
      ) : (
        <CirclePlay aria-hidden="true" className="rtl:-scale-x-100" />
      )}
      {t(`course.progress.${resume.kind}`)}
    </LinkButton>
  );
}

function ActiveProgress({
  courseId,
  enrollment,
  resume,
  lessonCount,
  showButton,
}: {
  courseId: string;
  enrollment: Enrollment;
  resume: ResumeTarget | null;
  lessonCount: number;
  showButton: boolean;
}) {
  const t = useTranslations('learn');
  const completed = enrollment.completedLessonCount;
  return (
    <div className="flex flex-col gap-3">
      <h2 className={TITLE}>{t('course.progress.title')}</h2>
      <ProgressBar
        value={enrollment.progressPercent}
        label={t('course.progress.title')}
        showValue
      />
      <p className="text-sm text-ink-muted">
        {t('course.progress.lessons', { completed, total: Math.max(lessonCount, completed) })}
      </p>
      <FromClassChip enrollment={enrollment} />
      {showButton && resume !== null && (
        <div className="mt-2">
          <ResumeLink courseId={courseId} resume={resume} variant="primary" />
        </div>
      )}
    </div>
  );
}

/**
 * The status card beside the outline, in priority order: the licence alert, the enrolled
 * student's progress and next lesson, the completed course, or the Enroll button.
 */
export function EnrollPanel({
  courseId,
  enrollment,
  resume,
  access,
  lessonCount,
}: EnrollPanelProps) {
  const t = useTranslations('learn');

  let body;
  if (access === 'license_required') {
    body = (
      <>
        <Alert tone="warning" title={t('course.license.title')} live="off">
          {t('course.license.description')}
        </Alert>
        {enrollment !== null && (
          <ActiveProgress
            courseId={courseId}
            enrollment={enrollment}
            resume={resume}
            lessonCount={lessonCount}
            showButton={false}
          />
        )}
      </>
    );
  } else if (enrollment?.status === 'active') {
    body = (
      <ActiveProgress
        courseId={courseId}
        enrollment={enrollment}
        resume={resume}
        lessonCount={lessonCount}
        showButton
      />
    );
  } else if (enrollment?.status === 'completed') {
    body = (
      <div className="flex flex-col gap-3">
        <StatusChip status="completed" className="self-start" />
        <h2 className={TITLE}>{t('course.completed.title')}</h2>
        <p className="text-sm text-ink-muted">{t('course.completed.description')}</p>
        <FromClassChip enrollment={enrollment} />
        <div className="mt-2 flex flex-col gap-3">
          {enrollment.certificateId !== null && (
            <LinkButton href={`/certificates/${enrollment.certificateId}`} size="lg" fullWidth>
              <Award aria-hidden="true" />
              {t('course.completed.certificate')}
            </LinkButton>
          )}
          {resume !== null && (
            <ResumeLink courseId={courseId} resume={resume} variant="secondary" />
          )}
        </div>
      </div>
    );
  } else {
    body = (
      <div className="flex flex-col gap-3">
        <h2 className={TITLE}>{t('course.enroll.title')}</h2>
        <p className="text-sm text-ink-muted">{t('course.enroll.description')}</p>
        {lessonCount === 0 && (
          <p className="text-sm text-ink-muted">{t('course.noLessons.description')}</p>
        )}
        <div className="mt-2">
          <EnrollButton courseId={courseId} />
        </div>
      </div>
    );
  }

  return (
    <Card tone="brand" className="gap-5 p-5 sm:p-6">
      {body}
    </Card>
  );
}
