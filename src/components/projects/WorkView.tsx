import { ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Chip } from '@/components/ui';
import { CODE_LANGUAGES } from '@/types/content';
import type { Submission } from '@/types/project';

export interface WorkViewProps {
  submission: Submission;
  headingLevel: 'h3' | 'h4';
}

/** A student link becomes a link only when it is https (the schema checked it when it was sent). */
function safeHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

function isKnownLanguage(value: string): value is (typeof CODE_LANGUAGES)[number] {
  return (CODE_LANGUAGES as readonly string[]).includes(value);
}

/**
 * What the student sent, as plain text: never Markdown or HTML. The attachments are listed by
 * AttachmentList next to it.
 */
export function WorkView({ submission, headingLevel: Heading }: WorkViewProps) {
  const t = useTranslations('projects');
  const tCommon = useTranslations('common');
  const { description, content, attachments } = submission;
  const text = content.text !== null && content.text.trim() !== '' ? content.text : null;
  const code = content.code !== null && content.code.trim() !== '' ? content.code : null;
  const link = content.linkUrl;
  const about = description.trim() !== '' ? description : null;
  const headingClasses = 'text-sm font-semibold text-ink';

  if (about === null && text === null && code === null && link === null && attachments.length === 0) {
    return <p className="text-ink-muted">{t('work.noContent')}</p>;
  }

  const language = content.codeLanguage;
  return (
    <div className="flex min-w-0 flex-col gap-5">
      {about !== null && (
        <div className="flex min-w-0 flex-col gap-1">
          <Heading className={headingClasses}>{t('work.description')}</Heading>
          <p className="text-base break-words whitespace-pre-wrap text-ink">{about}</p>
        </div>
      )}
      {text !== null && (
        <div className="flex min-w-0 flex-col gap-2">
          <Heading className={headingClasses}>{t('work.text')}</Heading>
          <p className="rounded-control border border-border bg-surface p-4 text-base break-words whitespace-pre-wrap text-ink">
            {text}
          </p>
        </div>
      )}
      {code !== null && (
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Heading className={headingClasses}>{t('work.code')}</Heading>
            {language !== null && language !== '' && (
              <Chip>{isKnownLanguage(language) ? t(`codeLanguages.${language}`) : language}</Chip>
            )}
          </div>
          <div
            role="region"
            tabIndex={0}
            aria-label={t('work.codeRegion')}
            className="max-h-[32rem] overflow-auto rounded-control border border-border bg-surface-muted p-4"
          >
            <pre className="font-mono text-sm text-ink">
              <code>{code}</code>
            </pre>
          </div>
        </div>
      )}
      {link !== null && (
        <div className="flex min-w-0 flex-col gap-1">
          <Heading className={headingClasses}>{t('work.link')}</Heading>
          {safeHttpsUrl(link) ? (
            <p className="flex items-start gap-1.5">
              <ExternalLink aria-hidden="true" className="mt-1 size-4 shrink-0 text-brand-700" />
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
                referrerPolicy="no-referrer"
                className="font-medium break-all text-brand-700 underline underline-offset-2"
              >
                {link}
                <span className="sr-only"> ({tCommon('a11y.opensInNewTab')})</span>
              </a>
            </p>
          ) : (
            <p className="break-all text-ink">{link}</p>
          )}
          <p className="text-sm text-ink-muted">{t('work.linkHint')}</p>
        </div>
      )}
    </div>
  );
}
