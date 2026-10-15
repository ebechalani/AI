import { CircleCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { stageAnchor, type StepperStage } from './lesson-model';

export interface StageStepperProps {
  /** The stages that have blocks, in lesson-flow order, then `earn`. */
  stages: StepperStage[];
  lessonCompleted: boolean;
}

/**
 * The lesson's steps as chips that jump to their section. On phones the row scrolls inside
 * itself, so the page never scrolls sideways; from `sm` up the chips wrap, so every step stays
 * in view even beside the outline and the tutor (up to nine chips, longer in French).
 */
export function StageStepper({ stages, lessonCompleted }: StageStepperProps) {
  const t = useTranslations('lesson');
  const tDomain = useTranslations('domain');
  return (
    <nav aria-label={t('topBar.stages')} className="min-w-0">
      {/* On focus the browser scrolls a chip it finds hidden to the middle of the phone row, but
          leaves a partly hidden one alone. With an inline scroll padding wider than any chip
          (French "Demander à l’IA" is about 140 px), a chip it leaves alone is fully in view. */}
      <ol className="-mx-1 flex scroll-px-36 gap-1.5 overflow-x-auto px-1 py-1 [scrollbar-width:thin] sm:flex-wrap sm:overflow-x-visible">
        {stages.map((stage, index) => {
          const number = index + 1;
          const label = tDomain(`stages.${stage}`);
          const done = stage === 'earn' && lessonCompleted;
          return (
            <li key={stage} className="shrink-0">
              <a
                href={`#${stageAnchor(stage)}`}
                className={cn(
                  'relative inline-flex min-h-8 items-center gap-1.5 rounded-full border py-1 ps-1 pe-3 text-xs font-semibold whitespace-nowrap transition-colors',
                  done
                    ? 'border-success/30 bg-success/10 text-ink hover:bg-success/15'
                    : 'border-border bg-surface text-ink hover:border-brand-200 hover:bg-brand-50',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-6 items-center justify-center rounded-full text-[0.7rem] tabular-nums',
                    done ? 'bg-success text-white' : 'bg-brand-100 text-brand-800',
                  )}
                >
                  {done ? <CircleCheck className="size-4" /> : number}
                </span>
                <span className="sr-only">{t('stepper.step', { number, stage: label })}</span>
                <span aria-hidden="true">{label}</span>
                {done && <span className="sr-only"> {t('stepper.earnDone')}</span>}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
