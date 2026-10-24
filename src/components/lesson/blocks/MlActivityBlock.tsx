import { BrainCircuit, ExternalLink, FileText } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { RichText } from '@/components/domain';
import { Alert, Card, Chip, LinkButton } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { isFrenchWorksheet, toMlActivityHref, toMlWorksheetHref } from '@/lib/learning/ml-activity';
import type { BlockRendererProps } from './registry';

/**
 * An activity on Machine Learning for Kids (ARCHITECTURE.md 7.6). The site may not be framed,
 * so the block links out to it in a new tab, after a fixed notice about leaving RoboHolic AI.
 * A stored URL is still only data, so both links are checked again here; when the activity's
 * fails, the text stays and no button is shown. The block saves nothing and does not gate
 * completion: what the learner brings back goes in the lesson's project or reflection block.
 * In a course for teachers, the fixed texts that send a child to their teacher speak to the
 * teacher instead.
 */
export function MlActivityBlock({ block, runtime }: BlockRendererProps<'ml_activity'>) {
  const locale = useLocale();
  const t = useTranslations('lesson');
  const text = pickTranslation(block.translations, locale, block.defaultLocale);
  const { url, worksheetUrl, projectType, codeTool, access } = block.data;
  const href = toMlActivityHref(url, locale);
  const worksheet = worksheetUrl === null ? null : toMlWorksheetHref(worksheetUrl);
  const forTeachers = runtime.audience === 'teacher';
  // Ready-trained models open Scratch straight from /#!/pretrained, with no login and no Try it
  // now project, so the access mode means nothing there.
  const usesAccount = projectType !== 'pretrained';
  // A block's links are the same in every language and only one student worksheet exists in
  // French, so the label names the worksheet's language when it is not the reader's.
  const worksheetLocale = worksheet !== null && isFrenchWorksheet(worksheet) ? 'fr' : 'en';
  const worksheetLabel =
    worksheetLocale === locale
      ? 'blocks.ml.worksheet'
      : worksheetLocale === 'fr'
        ? 'blocks.ml.worksheetInFrench'
        : 'blocks.ml.worksheetInEnglish';

  return (
    <Card>
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-col gap-2">
          <h3 className="text-lg leading-snug font-semibold break-words text-ink">{text.title}</h3>
          <div className="flex flex-wrap gap-2">
            <Chip tone="brand" icon={<BrainCircuit aria-hidden="true" />}>
              {t('blocks.ml.badge')}
            </Chip>
            <Chip>{t(`blocks.ml.projectTypes.${projectType}`)}</Chip>
            <Chip>{t(`blocks.ml.codeTools.${codeTool}`)}</Chip>
            {usesAccount && (
              <Chip>
                {forTeachers && access === 'class_account'
                  ? t('blocks.ml.forTeachers.classAccount')
                  : t(`blocks.ml.access.${access}`)}
              </Chip>
            )}
          </div>
        </div>
        {/* Part of the page, not news: a screen reader reads it in order, never on its own. */}
        <Alert tone="warning" title={t('blocks.ml.leavingTitle')} live="off">
          <p>{t(forTeachers ? 'blocks.ml.forTeachers.leaving' : 'blocks.ml.leaving')}</p>
          {usesAccount && access === 'try_it_now' && (
            <p className="mt-2">{t('blocks.ml.tryItNowNote')}</p>
          )}
        </Alert>
        <RichText markdown={text.instructions} />
        {text.bringBack && (
          <div className="flex flex-col gap-1 rounded-control border-s-4 border-brand-300 bg-brand-50 px-4 py-3">
            <h4 className="font-semibold text-ink">{t('blocks.ml.bringBackTitle')}</h4>
            <p className="leading-relaxed break-words whitespace-pre-line text-ink">
              {text.bringBack}
            </p>
          </div>
        )}
        {text.hint && (
          <details className="rounded-control border border-border">
            <summary className="flex min-h-11 cursor-pointer items-center rounded-control px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50">
              {t('blocks.ml.hint')}
            </summary>
            <p className="border-t border-border px-4 py-3 text-sm leading-relaxed whitespace-pre-line text-ink">
              {text.hint}
            </p>
          </details>
        )}
        {href === null ? (
          <Alert tone="info" live="off">
            {t(forTeachers ? 'blocks.ml.forTeachers.unavailable' : 'blocks.ml.unavailable')}
          </Alert>
        ) : (
          // Absolute URLs: LinkButton opens them in a new tab, with no opener and no referrer,
          // and tells screen readers so.
          <div className="flex flex-wrap gap-3">
            <LinkButton href={href}>
              <ExternalLink aria-hidden="true" className="rtl:-scale-x-100" />
              {t('blocks.ml.open')}
            </LinkButton>
            {worksheet !== null && (
              <LinkButton href={worksheet} variant="secondary">
                <FileText aria-hidden="true" />
                {t(worksheetLabel)}
              </LinkButton>
            )}
          </div>
        )}
        <p className="text-xs leading-relaxed text-ink-muted">{t('blocks.ml.attribution')}</p>
      </div>
    </Card>
  );
}
