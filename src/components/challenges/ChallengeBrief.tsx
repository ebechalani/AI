import type { ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ProgressBar } from '@/components/ui';
import type { Challenge } from '@/types/challenge';
import { rubricRows, type ChallengeText } from './challenges-model';

function BriefSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-3">
      <h2 id={id} className="text-lg font-semibold text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

export interface ChallengeBriefProps {
  challenge: Pick<Challenge, 'allowedSubmissionTypes' | 'rubric'>;
  text: ChallengeText;
}

/**
 * What the challenge asks for: about, what to submit, prizes and how entries are judged. The
 * challenge text is plain text, never Markdown.
 */
export function ChallengeBrief({ challenge, text }: ChallengeBriefProps) {
  const t = useTranslations('challenges');
  const tDomain = useTranslations('domain');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const types = new Intl.ListFormat(locale, { type: 'disjunction' }).format(
    challenge.allowedSubmissionTypes.map((type) => tDomain(`submissionTypes.${type}`)),
  );
  const rubric = rubricRows(challenge.rubric);

  return (
    <div className="flex flex-col gap-8">
      {text.description && (
        <BriefSection id="challenge-about" title={t('detail.about')}>
          <p className="break-words whitespace-pre-line text-ink">{text.description}</p>
        </BriefSection>
      )}
      <BriefSection id="challenge-requirements" title={t('detail.requirements')}>
        {text.requirements && (
          <p className="break-words whitespace-pre-line text-ink">{text.requirements}</p>
        )}
        {challenge.allowedSubmissionTypes.length > 0 && (
          <p className="text-sm font-medium text-ink-muted">
            {t('detail.allowedTypes', { types })}
          </p>
        )}
      </BriefSection>
      {text.prizes !== null && (
        <BriefSection id="challenge-prizes" title={t('detail.prizes')}>
          <p className="break-words whitespace-pre-line text-ink">{text.prizes}</p>
        </BriefSection>
      )}
      {rubric.length > 0 && (
        <BriefSection id="challenge-judging" title={t('detail.judging.title')}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {rubric.map((row) => (
              <li key={row.key} className="flex min-w-0 flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 font-medium text-ink">
                    {tDomain(`rubric.${row.key}`)}
                  </span>
                  <span className="shrink-0 font-semibold text-ink tabular-nums">
                    {tCommon('units.percent', { value: row.weight })}
                  </span>
                </div>
                {/* Decorative: a progressbar role would read a judging weight as "40% complete". */}
                <div aria-hidden="true">
                  <ProgressBar value={row.weight} size="sm" />
                </div>
              </li>
            ))}
          </ul>
        </BriefSection>
      )}
    </div>
  );
}
