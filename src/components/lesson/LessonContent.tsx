import type { ReactNode } from 'react';
import { BookOpen, Clock, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useDurationFormat } from '@/components/domain';
import { Chip, EmptyState } from '@/components/ui';
import type { StageGroup } from '@/lib/learning/stages';
import type { LessonBlock } from '@/types/content';
import { BlockRenderer } from './BlockRenderer';
import type { LessonRuntime } from './blocks/registry';
import { blockAnchor, stageAnchor, type StepperStage } from './lesson-model';

interface StageSectionProps {
  stage: StepperStage;
  number: number;
  total: number;
  children: ReactNode;
}

/** One step of the lesson: "Step 2 of 7", the stage name as h2, then its content. */
function StageSection({ stage, number, total, children }: StageSectionProps) {
  const t = useTranslations('lesson');
  const tDomain = useTranslations('domain');
  const id = stageAnchor(stage);
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      // EARN receives focus when "Complete lesson" finds something missing.
      tabIndex={stage === 'earn' ? -1 : undefined}
      className="flex flex-col gap-5 outline-none"
    >
      <div className="flex flex-col gap-0.5 border-b border-border pb-2">
        <p className="text-sm font-semibold text-brand-700">
          {t('stage.stepOf', { number, total })}
        </p>
        <h2 id={`${id}-title`} className="text-xl leading-snug font-bold text-ink sm:text-2xl">
          {tDomain(`stages.${stage}`)}
        </h2>
      </div>
      {children}
    </section>
  );
}

export interface LessonContentProps {
  title: string;
  summary: string;
  position: number;
  total: number;
  estimatedMinutes: number;
  xpReward: number;
  groups: StageGroup<LessonBlock>[];
  /** The stepper's chip count, EARN included, so section numbers match the chips. */
  stepCount: number;
  runtime: LessonRuntime;
  /** The read-only notice, or null. */
  notice: ReactNode;
  /** The content of the EARN section (the checklist). */
  earn: ReactNode;
}

/** The lesson itself: header, preview notice, one section per stage, and EARN last. */
export function LessonContent({
  title,
  summary,
  position,
  total,
  estimatedMinutes,
  xpReward,
  groups,
  stepCount,
  runtime,
  notice,
  earn,
}: LessonContentProps) {
  const t = useTranslations('lesson');
  const formatDuration = useDurationFormat();

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-brand-700">
          {t('header.position', { current: position, total })}
        </p>
        <h1 className="text-2xl leading-tight font-bold text-ink sm:text-3xl">{title}</h1>
        {summary && <p className="text-lg leading-relaxed text-ink-muted">{summary}</p>}
        <div className="flex flex-wrap items-center gap-2">
          {estimatedMinutes > 0 && (
            <Chip size="md" icon={<Clock aria-hidden="true" />}>
              {formatDuration(estimatedMinutes)}
            </Chip>
          )}
          {xpReward > 0 && (
            <Chip size="md" tone="brand" icon={<Zap aria-hidden="true" />}>
              {t('header.xpReward', { xp: xpReward })}
            </Chip>
          )}
        </div>
      </header>

      {notice}

      {groups.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title={t('empty.title')}
          description={t('empty.description')}
        />
      ) : (
        groups.map((group, index) => (
          <StageSection key={group.stage} stage={group.stage} number={index + 1} total={stepCount}>
            {group.blocks.map((block) => (
              // A stepper chip or a checklist link jumps here; LessonShell keeps the target
              // clear of the sticky top bar.
              <div key={block.id} id={blockAnchor(block.id)}>
                <BlockRenderer block={block} runtime={runtime} />
              </div>
            ))}
          </StageSection>
        ))
      )}

      <StageSection stage="earn" number={stepCount} total={stepCount}>
        {earn}
      </StageSection>
    </div>
  );
}
