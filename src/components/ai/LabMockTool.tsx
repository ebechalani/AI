'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Alert, Button, Card, FormField, Select, Textarea } from '@/components/ui';
import { AI_LIMITS } from '@/lib/limits';
import { MOCK_TOOL_OPTIONS, mockMessageKey, type MockLabToolId } from './lab-model';
import { LabMockPreview } from './LabMockPreview';
import { LabResultCard } from './LabResultCard';
import { LabResults } from './LabResults';
import { useLabRun } from './use-lab-run';

export interface LabMockToolProps {
  toolId: MockLabToolId;
  /** The tool's lucide icon name, for the decorative preview. */
  icon: string;
}

/**
 * A demo tool (8.5): the real interface (a prompt and a choice) with a canned result. No AI
 * runs, so nothing is counted; the school's AI switch still applies (8.6.3).
 */
export function LabMockTool({ toolId, icon }: LabMockToolProps) {
  const t = useTranslations('aiLab');
  const { runs, pending, fieldError, block, run, clearFieldError, resultsHeadingRef, promptRef } =
    useLabRun(toolId);
  const choices = MOCK_TOOL_OPTIONS[toolId];
  const [prompt, setPrompt] = useState('');
  const [option, setOption] = useState(choices[0] ?? '');
  const optionLabel = (value: string) => t(`tools.${toolId}.options.${value}`);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    run(prompt, option);
  }

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <Card>
        <form noValidate onSubmit={submit} className="flex flex-col gap-4 p-5 sm:p-6">
          <FormField label={t(`tools.${toolId}.promptLabel`)} error={fieldError} required>
            <Textarea
              ref={promptRef}
              rows={3}
              maxLength={AI_LIMITS.labPromptChars}
              placeholder={t(`tools.${toolId}.placeholder`)}
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
                if (fieldError !== undefined) clearFieldError();
              }}
            />
          </FormField>
          <FormField label={t(`tools.${toolId}.optionLabel`)} className="sm:max-w-xs">
            <Select
              value={option}
              onChange={(event) => setOption(event.target.value)}
              options={choices.map((value) => ({ value, label: optionLabel(value) }))}
            />
          </FormField>
          {toolId === 'vision' && (
            <p className="text-sm text-ink-muted">{t('tools.vision.samplesNote')}</p>
          )}

          {block === 'limit' && <Alert tone="warning">{t('limitReached')}</Alert>}
          {block === 'disabled' && (
            <Alert tone="warning" title={t('disabled.title')}>
              {t('disabled.description')}
            </Alert>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={pending} disabled={block !== null}>
              {t('form.tryDemo')}
            </Button>
          </div>
        </form>
      </Card>

      <LabResults
        runs={runs}
        headingRef={resultsHeadingRef}
        renderRun={(entry) => {
          const caption = entry.option === null ? '' : optionLabel(entry.option);
          return (
            <LabResultCard variant="demo" prompt={entry.prompt} option={caption}>
              <div className="flex flex-col gap-4">
                <LabMockPreview icon={icon} caption={caption} />
                <p className="text-sm leading-relaxed text-ink">
                  {entry.result.kind === 'mock'
                    ? t(mockMessageKey(toolId, entry.result.messageKey))
                    : t('unavailable')}
                </p>
              </div>
            </LabResultCard>
          );
        }}
      />
    </div>
  );
}
