import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { own } from '../lesson-model';
import type { BlockRendererProps } from './registry';
import { ReflectionForm } from './ReflectionForm';

/** A written answer with a minimum length; it counts towards "Complete lesson" (9.4). */
export function ReflectionBlock({ block, runtime }: BlockRendererProps<'reflection'>) {
  const t = useTranslations('lesson');
  const text = pickTranslation(block.translations, useLocale(), block.defaultLocale);
  return (
    <Card>
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <h3 className="text-lg leading-snug font-semibold text-ink">
          {t('blocks.reflection.title')}
        </h3>
        {/* Block ids are unique per lesson only, so the key carries the lesson. */}
        <ReflectionForm
          key={`${runtime.lessonId}/${block.id}`}
          courseId={runtime.courseId}
          lessonId={runtime.lessonId}
          blockId={block.id}
          prompt={text.prompt}
          minLength={block.data.minLength}
          initialText={own(runtime.responses, block.id) ?? ''}
          readOnly={runtime.readOnly}
        />
      </div>
    </Card>
  );
}
