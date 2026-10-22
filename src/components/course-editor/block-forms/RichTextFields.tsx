'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { RichText } from '@/components/domain';
import { Button } from '@/components/ui';
import { CONTENT_LIMITS } from '@/lib/limits';
import { BlockTextField } from './BlockTextField';
import type { BlockTextProps } from './types';

export function RichTextText(form: BlockTextProps<'rich_text'>) {
  const t = useTranslations('courseEditor');
  const previewId = useId();
  const [preview, setPreview] = useState(false);
  const body = form.draft.text[form.locale].body;
  return (
    <>
      <BlockTextField form={form} field="heading" label={t('blocks.richText.heading')} max={CONTENT_LIMITS.titleChars} />
      <BlockTextField
        form={form}
        field="body"
        label={t('blocks.richText.body')}
        max={CONTENT_LIMITS.richTextBodyChars}
        multiline
        rows={10}
        hint={t('blocks.richText.bodyHint')}
      />
      <div className="flex flex-col gap-3">
        <div>
          <Button
            size="sm"
            variant="secondary"
            aria-pressed={preview}
            aria-controls={preview ? previewId : undefined}
            onClick={() => setPreview((shown) => !shown)}
          >
            {preview ? t('blocks.richText.hidePreview') : t('blocks.richText.preview')}
          </Button>
        </div>
        {preview && (
          <section
            id={previewId}
            aria-live="off"
            aria-labelledby={`${previewId}-heading`}
            className="rounded-control border border-border bg-surface p-4"
          >
            <h4 id={`${previewId}-heading`} className="mb-2 text-sm font-semibold text-ink-muted">
              {t('blocks.richText.previewHeading')}
            </h4>
            <RichText markdown={body} />
          </section>
        )}
      </div>
    </>
  );
}
