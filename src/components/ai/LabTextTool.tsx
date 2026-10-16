'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { RichText } from '@/components/domain';
import { Alert, Button, Card, FormField, Textarea } from '@/components/ui';
import { AI_LIMITS } from '@/lib/limits';
import { TEXT_EXAMPLE_KEYS } from './lab-model';
import { LabResultCard } from './LabResultCard';
import { LabResults } from './LabResults';
import { useLabRun } from './use-lab-run';

/** The live text tool (8.5): a prompt, example prompts, and the results of this visit. */
export function LabTextTool() {
  const t = useTranslations('aiLab');
  const { runs, pending, fieldError, block, run, clearFieldError, resultsHeadingRef, promptRef } =
    useLabRun('text');
  const [prompt, setPrompt] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    run(prompt, null);
  }

  function pickExample(text: string) {
    setPrompt(text);
    clearFieldError();
    promptRef.current?.focus();
  }

  function clear() {
    setPrompt('');
    clearFieldError();
    promptRef.current?.focus();
  }

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <Card>
        <form noValidate onSubmit={submit} className="flex flex-col gap-4 p-5 sm:p-6">
          <FormField
            label={t('tools.text.promptLabel')}
            hint={t('form.charCount', { count: prompt.length, max: AI_LIMITS.labPromptChars })}
            error={fieldError}
            required
          >
            <Textarea
              ref={promptRef}
              rows={5}
              maxLength={AI_LIMITS.labPromptChars}
              placeholder={t('tools.text.placeholder')}
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
                if (fieldError !== undefined) clearFieldError();
              }}
            />
          </FormField>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-ink-muted">{t('form.examples')}</p>
            <ul className="flex flex-wrap gap-2">
              {TEXT_EXAMPLE_KEYS.map((key) => {
                const example = t(`tools.text.examples.${key}`);
                return (
                  <li key={key} className="max-w-full">
                    <Button variant="secondary" size="sm" onClick={() => pickExample(example)}>
                      {example}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>

          {block === 'limit' && <Alert tone="warning">{t('limitReached')}</Alert>}
          {block === 'disabled' && (
            <Alert tone="warning" title={t('disabled.title')}>
              {t('disabled.description')}
            </Alert>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={pending} disabled={block !== null}>
              {t('form.generate')}
            </Button>
            <Button variant="ghost" onClick={clear}>
              {t('form.clear')}
            </Button>
          </div>
        </form>
      </Card>

      <LabResults
        runs={runs}
        headingRef={resultsHeadingRef}
        renderRun={(entry) => (
          <LabResultCard variant="ai" prompt={entry.prompt}>
            {entry.result.kind === 'text' ? (
              <RichText markdown={entry.result.text} size="sm" />
            ) : (
              <p className="text-sm text-ink">{t('unavailable')}</p>
            )}
          </LabResultCard>
        )}
      />
    </div>
  );
}
