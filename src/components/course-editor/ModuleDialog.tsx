'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { createModuleAction, updateModuleAction } from '@/actions/course-editor';
import { Button, Dialog, useToast } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { CONTENT_LIMITS } from '@/lib/limits';
import { moduleInputSchema } from '@/lib/schemas/course';
import { parseInput } from '@/lib/schemas/common';
import type { Locale } from '@/types/common';
import { DIALOG_TEXT } from './dialog';
import { FormAlert } from './FormAlert';
import { LanguageSwitch } from './LanguageSwitch';
import {
  moduleDraftToInput,
  moduleToDraft,
  newModuleDraft,
  type ModuleDraft,
} from './module-lesson-model';
import type { ModuleRow } from './rows';
import { TextField } from './TextField';
import { translationStates } from './translations';
import { useEditorAction } from './use-editor-action';
import { useFormErrors } from './use-form-errors';

const ORDER = ['defaultLocale', 'translations'];

export interface ModuleDialogProps {
  open: boolean;
  onClose(): void;
  courseId: string;
  /** null = a new module. */
  module: ModuleRow | null;
  /** The course's language, for a new module. */
  defaultLocale: Locale;
  /** After a success (the owner refreshes and moves the focus). */
  onSaved(moduleId: string, created: boolean): void;
}

/** Creates or renames a module. Mounted afresh at every opening, from the latest props. */
export function ModuleDialog({
  open,
  onClose,
  courseId,
  module,
  defaultLocale,
  onSaved,
}: ModuleDialogProps) {
  const t = useTranslations('courseEditor');
  const tCommon = useTranslations('common');
  const uiLocale = useLocale();
  const { toast } = useToast();
  const { run } = useEditorAction();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<ModuleDraft>(() =>
    module === null ? newModuleDraft(defaultLocale) : moduleToDraft(module),
  );
  const [language, setLanguage] = useState<Locale>(draft.defaultLocale);
  const [pending, setPending] = useState(false);
  const errors = useFormErrors({
    formRef,
    alertRef,
    language,
    setLanguage,
    order: ORDER,
    isShown: (path) => /^translations\.[a-z]+\.(title|description)$/.test(path),
  });
  const required = language === draft.defaultLocale;
  const moduleTitle =
    module === null ? '' : pickTranslation(module.translations, uiLocale, module.defaultLocale).title;

  function setText(field: 'title' | 'description', value: string) {
    setDraft((current) => ({
      ...current,
      text: { ...current.text, [language]: { ...current.text[language], [field]: value } },
    }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const input = moduleDraftToInput(draft);
    const parsed = parseInput(moduleInputSchema, input);
    if (!parsed.success) {
      errors.show(parsed.fieldErrors);
      return;
    }
    errors.clear();
    setPending(true);
    const result =
      module === null
        ? await run(() => createModuleAction({ courseId, input }), {
            context: { action: 'createModule' },
            report: errors.fail,
            onFieldErrors: errors.show,
          })
        : await run(
            async () => {
              const saved = await updateModuleAction({ courseId, moduleId: module.id, patch: input });
              return saved.ok ? { ok: true as const, data: { moduleId: module.id } } : saved;
            },
            { report: errors.fail, onFieldErrors: errors.show },
          );
    setPending(false);
    if (!result.ok) {
      if (result.error.code === 'not_found') onClose();
      return;
    }
    toast({ tone: 'success', title: module === null ? t('module.created') : t('module.saved') });
    onSaved(result.data.moduleId, module === null);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={module === null ? t('module.createTitle') : t('module.editTitle', { module: moduleTitle })}
      size="md"
      className={DIALOG_TEXT}
      dismissible={!pending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            {tCommon('actions.cancel')}
          </Button>
          <Button type="submit" form={formId} loading={pending}>
            {tCommon('actions.save')}
          </Button>
        </>
      }
    >
      <form id={formId} ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        <LanguageSwitch
          name={`${formId}-language`}
          value={language}
          onChange={setLanguage}
          defaultLocale={draft.defaultLocale}
          states={translationStates(draft.text, draft.defaultLocale)}
          disabled={pending}
        />
        <TextField
          key={`title-${language}`}
          label={t('fields.title')}
          locale={language}
          value={draft.text[language].title}
          onChange={(value) => setText('title', value)}
          required={required}
          max={CONTENT_LIMITS.titleChars}
          error={errors.errorFor(`translations.${language}.title`)}
          disabled={pending}
          autoFocus
        />
        <TextField
          key={`description-${language}`}
          label={t('fields.moduleDescription')}
          locale={language}
          value={draft.text[language].description}
          onChange={(value) => setText('description', value)}
          required={required}
          multiline
          rows={3}
          max={CONTENT_LIMITS.moduleDescriptionChars}
          error={errors.errorFor(`translations.${language}.description`)}
          disabled={pending}
        />
        {module !== null && module.lessonCount > 0 && (
          <p className="text-sm text-ink-muted">{t('module.deleteHint')}</p>
        )}
        <FormAlert ref={alertRef} failure={errors.failure}>
          {errors.otherLanguageNote && <p className="mt-1">{errors.otherLanguageNote}</p>}
        </FormAlert>
      </form>
    </Dialog>
  );
}
