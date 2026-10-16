import { useLocale, useTranslations } from 'next-intl';
import type { SubmissionType } from '@/types/common';

export interface ProjectBriefProps {
  text: { brief: string; requirements: string };
  /** Shown as "You can send: …" when given. */
  allowedTypes: SubmissionType[] | null;
  headingLevel: 'h3' | 'h4';
}

/** What to do and what to hand in. Plain text, never Markdown. */
export function ProjectBrief({ text, allowedTypes, headingLevel: Heading }: ProjectBriefProps) {
  const t = useTranslations('projects');
  const tDomain = useTranslations('domain');
  const locale = useLocale();
  const headingClasses = 'text-sm font-semibold text-ink';
  const bodyClasses = 'mt-1 text-base break-words whitespace-pre-line text-ink-muted';
  const types =
    allowedTypes === null || allowedTypes.length === 0
      ? null
      : new Intl.ListFormat(locale, { type: 'disjunction' }).format(
          allowedTypes.map((type) => tDomain(`submissionTypes.${type}`)),
        );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {text.brief.trim() !== '' && (
        <div>
          <Heading className={headingClasses}>{t('brief.brief')}</Heading>
          <p className={bodyClasses}>{text.brief}</p>
        </div>
      )}
      {text.requirements.trim() !== '' && (
        <div>
          <Heading className={headingClasses}>{t('brief.requirements')}</Heading>
          <p className={bodyClasses}>{text.requirements}</p>
        </div>
      )}
      {types !== null && (
        <p className="text-sm font-medium text-ink">{t('brief.allowedTypes', { types })}</p>
      )}
    </div>
  );
}
