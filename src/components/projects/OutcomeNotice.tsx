import type { ReactNode } from 'react';
import { CircleCheck, Clock, Sparkles, TriangleAlert, Undo2, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { StatusTone } from '@/components/ui';
import { TONE_ICON, TONE_PANEL } from '@/components/ui/tones';
import { cn } from '@/lib/utils';
import { OUTCOME_KEYS, type StudentOutcome } from './projects-model';
import { RefocusHeading } from './RefocusHeading';

const LOOK: Record<StudentOutcome['kind'], { tone: StatusTone; icon: LucideIcon }> = {
  waiting_teacher: { tone: 'info', icon: Clock },
  ai_pending: { tone: 'info', icon: Sparkles },
  ai_unavailable: { tone: 'warning', icon: TriangleAlert },
  approved: { tone: 'success', icon: CircleCheck },
  ai_reviewed: { tone: 'success', icon: CircleCheck },
  returned_teacher: { tone: 'warning', icon: Undo2 },
  returned_ai: { tone: 'warning', icon: Undo2 },
};

export interface OutcomeNoticeProps {
  outcome: StudentOutcome;
  headingLevel: 'h2' | 'h3' | 'h4';
  /**
   * Whether "You can ask N more times" is shown: only where the retry button is rendered (the
   * detail page), so the notice never promises a button it does not show.
   */
  retryHint: boolean;
  /** When given, the title takes focus back after a refresh changed it (RefocusHeading). */
  focusKey?: string;
  /** The buttons (Check again, Ask Robo AI again). */
  children?: ReactNode;
}

/** Where the student's attempt stands, in their words (SPEC-D 5.4). Part of the page: not live. */
export function OutcomeNotice({
  outcome,
  headingLevel,
  retryHint,
  focusKey,
  children,
}: OutcomeNoticeProps) {
  const t = useTranslations('projects');
  const { tone, icon: Icon } = LOOK[outcome.kind];
  const key = OUTCOME_KEYS[outcome.kind];
  const titleClasses = 'text-base leading-snug font-semibold break-words text-ink';
  const title = t(`outcome.${key}.title`);
  const Heading = headingLevel;

  return (
    <div className={cn('flex items-start gap-3 rounded-card border p-4 sm:p-5', TONE_PANEL[tone])}>
      <Icon aria-hidden="true" className={cn('mt-0.5 size-5 shrink-0', TONE_ICON[tone])} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {focusKey === undefined ? (
          <Heading className={titleClasses}>{title}</Heading>
        ) : (
          <RefocusHeading as={headingLevel} focusKey={focusKey} className={titleClasses}>
            {title}
          </RefocusHeading>
        )}
        {outcome.kind === 'ai_unavailable' ? (
          <>
            <p className="text-sm text-ink">{t(`outcome.aiUnavailable.${outcome.reason}`)}</p>
            {retryHint && (
              <p className="text-sm text-ink">
                {outcome.retriesLeft > 0
                  ? t('outcome.aiUnavailable.retriesLeft', { count: outcome.retriesLeft })
                  : t('outcome.aiUnavailable.noRetries')}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-ink">{t(`outcome.${key}.description`)}</p>
        )}
        {children && <div className="mt-2 flex flex-wrap items-center gap-3">{children}</div>}
      </div>
    </div>
  );
}
