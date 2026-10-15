import { Code } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, Chip } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { own } from '../lesson-model';
import { CodeActivityEditor } from './CodeActivityEditor';
import type { BlockRendererProps } from './registry';

/** Instructions and a code editor that saves the learner's code (running it comes later). */
export function CodeActivityBlock({ block, runtime }: BlockRendererProps<'code_activity'>) {
  const t = useTranslations('lesson');
  const text = pickTranslation(block.translations, useLocale(), block.defaultLocale);
  const { language, starterCode } = block.data;
  return (
    <Card>
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg leading-snug font-semibold text-ink">{t('blocks.code.title')}</h3>
          <Chip tone="accent" icon={<Code aria-hidden="true" />}>
            {t(`blocks.code.languages.${language}`)}
          </Chip>
        </div>
        <p className="leading-relaxed whitespace-pre-line text-ink">{text.instructions}</p>
        {/* Block ids are unique per lesson only, so the key carries the lesson. */}
        <CodeActivityEditor
          key={`${runtime.lessonId}/${block.id}`}
          courseId={runtime.courseId}
          lessonId={runtime.lessonId}
          blockId={block.id}
          starterCode={starterCode}
          initialCode={own(runtime.responses, block.id) ?? starterCode}
          hint={text.hint}
          readOnly={runtime.readOnly}
        />
      </div>
    </Card>
  );
}
