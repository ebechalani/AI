import { Eye, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Chip, LinkButton, ProgressBar } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { StepperStage } from './lesson-model';
import { StageStepper } from './StageStepper';

export interface LessonTopBarProps {
  courseTitle: string;
  /** The enrollment's progress; null in the read-only preview, which hides the bar. */
  progressPercent: number | null;
  stages: StepperStage[];
  lessonCompleted: boolean;
  exitHref: string;
  preview: boolean;
}

/**
 * The player's top bar: course title and exit, the course progress (beside the title from `sm`
 * up, under it on phones), then the stage stepper.
 */
export function LessonTopBar({
  courseTitle,
  progressPercent,
  stages,
  lessonCompleted,
  exitHref,
  preview,
}: LessonTopBarProps) {
  const t = useTranslations('lesson');
  const tNav = useTranslations('nav');
  const hasProgress = progressPercent !== null;

  return (
    <div
      className={cn(
        'grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1',
        hasProgress && 'sm:grid-cols-[minmax(0,1fr)_minmax(8rem,14rem)_auto]',
      )}
    >
      <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-2">
        <p className="min-w-0 truncate font-semibold text-ink">{courseTitle}</p>
        {preview && (
          <Chip tone="brand" icon={<Eye aria-hidden="true" />} className="shrink-0">
            {t('topBar.preview')}
          </Chip>
        )}
      </div>
      <LinkButton
        href={exitHref}
        variant="ghost"
        size="sm"
        className={cn('col-start-2 row-start-1', hasProgress && 'sm:col-start-3')}
      >
        <X aria-hidden="true" />
        <span className="max-sm:sr-only">{tNav('lesson.exit')}</span>
      </LinkButton>
      {hasProgress && (
        <ProgressBar
          value={progressPercent}
          label={t('topBar.progress')}
          size="sm"
          showValue
          className="col-span-2 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1"
        />
      )}
      <div className="col-span-full min-w-0">
        <StageStepper stages={stages} lessonCompleted={lessonCompleted} />
      </div>
    </div>
  );
}
