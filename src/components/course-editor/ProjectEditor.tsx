'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { createBlockAction, saveProjectAction } from '@/actions/course-editor';
import { Alert, Button, Card, CardTitle, RadioGroup, Switch, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import { CONTENT_LIMITS } from '@/lib/limits';
import { parseInput } from '@/lib/schemas/common';
import { projectInputSchema } from '@/lib/schemas/project';
import type { Locale } from '@/types/common';
import { PROJECT_KINDS, type Project, type ProjectKind } from '@/types/project';
import { ConflictAlert } from './ConflictAlert';
import { useEditorEvents } from './editor-events';
import { FormActions } from './FormActions';
import { FormAlert } from './FormAlert';
import { LanguageSwitch } from './LanguageSwitch';
import { NumberField } from './NumberField';
import { anchors, editorPaths, type EditorMode } from './paths';
import {
  newProjectDraft,
  projectDraftToInput,
  projectToDraft,
  type ProjectDraft,
  type ProjectTextField,
} from './project-model';
import { RubricField } from './RubricField';
import { SubmissionTypesField } from './SubmissionTypesField';
import { focusSyncNotice } from './SyncNotice';
import { TextField } from './TextField';
import { EDITABLE_LOCALES, translationStates } from './translations';
import { useEditorAction } from './use-editor-action';
import { useFormErrors } from './use-form-errors';
import { useServerSync } from './use-server-sync';
import { useRegisterDirty } from './unsaved-changes';

const ORDER = [
  'kind',
  'defaultLocale',
  'translations',
  'allowedSubmissionTypes',
  'rubric',
  'xpReward',
  'requiredForCertificate',
];
const SHOWN = new RegExp(
  `^(kind|defaultLocale|translations\\.(${EDITABLE_LOCALES.join('|')})\\.(title|brief|requirements)|allowedSubmissionTypes(\\.\\d+)?|rubric(\\.\\d+(\\.key|\\.weight)?)?|xpReward|requiredForCertificate)$`,
);

export interface ProjectEditorProps {
  courseId: string;
  mode: EditorMode;
  /** null = a new project. */
  projectId: string | null;
  project: Project | null;
  defaultLocale: Locale;
  /** The lesson the new project is added to on its first save (6.5). */
  addTo: { lessonId: string; title: string } | null;
  teacherCourse: boolean;
}

/** The project editor (6.5): kind, texts, submission types, criteria, XP, certificate. */
export function ProjectEditor({
  courseId,
  mode,
  projectId,
  project,
  defaultLocale,
  addTo,
  teacherCourse,
}: ProjectEditorProps) {
  const t = useTranslations('courseEditor');
  const router = useRouter();
  const { toast } = useToast();
  const { run, refresh, refreshing } = useEditorAction();
  const events = useEditorEvents();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const conflictRef = useRef<HTMLDivElement>(null);
  const paths = editorPaths(mode);
  const serverDraft = project ? projectToDraft(project) : newProjectDraft(defaultLocale);
  const sync = useServerSync(serverDraft, { refreshing });
  const { draft, dirty, conflict } = sync;
  const [language, setLanguage] = useState<Locale>(serverDraft.defaultLocale);
  const [pending, setPending] = useState(false);
  const [gone, setGone] = useState(false);
  useRegisterDirty('project', dirty);
  const errors = useFormErrors({
    formRef,
    alertRef,
    language,
    setLanguage,
    order: ORDER,
    isShown: (path) => SHOWN.test(path),
  });
  const required = language === draft.defaultLocale;

  function set(patch: Partial<ProjectDraft>) {
    sync.setDraft((current) => ({ ...current, ...patch }));
  }

  function setText(field: ProjectTextField, value: string) {
    sync.setDraft((current) => ({
      ...current,
      text: { ...current.text, [language]: { ...current.text[language], [field]: value } },
    }));
  }

  async function addBlock(newId: string) {
    if (addTo === null) return;
    const added = await run(
      () =>
        createBlockAction({
          courseId,
          lessonId: addTo.lessonId,
          input: {
            type: 'project',
            stage: 'build',
            defaultLocale: draft.defaultLocale,
            translations: {},
            data: { projectId: newId },
          },
        }),
      {
        context: { action: 'saveBlock', creating: true, blockCount: 0, link: 'project', teacherCourse },
        report: 'toast',
      },
    );
    if (added.ok) {
      toast({ tone: 'success', title: t('project.createdAndAdded', { lesson: addTo.title }) });
      router.push(`${paths.lesson(courseId, addTo.lessonId)}#${anchors.block(added.data.blockId)}`);
    } else {
      toast({ tone: 'danger', title: t('project.createdNotAdded') });
      router.replace(paths.project(courseId, newId));
    }
  }

  async function save(asNew: boolean) {
    if (pending) return;
    if (events.pending) {
      focusSyncNotice();
      return;
    }
    if (conflict) {
      conflictRef.current?.focus();
      return;
    }
    const input = projectDraftToInput(draft);
    const parsed = parseInput(projectInputSchema, input);
    if (!parsed.success) {
      errors.show(parsed.fieldErrors);
      return;
    }
    errors.clear();
    setPending(true);
    const id = asNew ? null : projectId;
    const result = await run(() => saveProjectAction({ courseId, projectId: id, input }), {
      report: errors.fail,
      onFieldErrors: errors.show,
      notFound: id === null ? 'gone' : 'report',
    });
    if (!result.ok) {
      setPending(false);
      if (result.error.code === 'not_found' && id !== null) {
        setGone(true);
        errors.fail({ message: t('project.gone'), sessionEnded: false });
      }
      return;
    }
    sync.markSaved();
    setGone(false);
    const newId = result.data.projectId;
    if (id !== null) {
      setPending(false);
      toast({ tone: 'success', title: t('project.saved') });
      refresh();
      return;
    }
    if (addTo !== null && !asNew) {
      await addBlock(newId);
      return;
    }
    toast({ tone: 'success', title: t('project.created') });
    router.replace(paths.project(courseId, newId));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save(false);
  }

  return (
    <form
      id="project-form"
      ref={formRef}
      noValidate
      onSubmit={onSubmit}
      className="flex min-w-0 flex-col gap-6"
    >
      {teacherCourse && (
        <Alert tone="info" live="off">
          {t('project.teacherCourse')}
        </Alert>
      )}
      {conflict && (
        <ConflictAlert ref={conflictRef} onTakeTheirs={sync.takeTheirs} onKeepMine={sync.keepMine} />
      )}
      <Card className="gap-5 p-5 sm:p-6">
        <CardTitle as="h2" className="text-lg font-bold">
          {t('project.cardTitle')}
        </CardTitle>
        <RadioGroup
          legend={t('project.kind')}
          name={`${formId}-kind`}
          orientation="horizontal"
          value={draft.kind}
          disabled={pending}
          error={errors.errorFor('kind')}
          onValueChange={(value) => set({ kind: value as ProjectKind })}
          options={PROJECT_KINDS.map((kind) => ({
            value: kind,
            label: t(`project.kinds.${kind}`),
            description: t(`project.kinds.${kind}Description`),
          }))}
        />
        <LanguageSwitch
          name={`${formId}-language`}
          value={language}
          onChange={setLanguage}
          defaultLocale={draft.defaultLocale}
          states={translationStates(draft.text, draft.defaultLocale)}
          disabled={pending}
        />
        <TextField
          label={t('fields.title')}
          locale={language}
          value={draft.text[language].title}
          onChange={(value) => setText('title', value)}
          required={required}
          max={CONTENT_LIMITS.titleChars}
          error={errors.errorFor(`translations.${language}.title`)}
          disabled={pending}
        />
        <TextField
          label={t('project.brief')}
          locale={language}
          value={draft.text[language].brief}
          onChange={(value) => setText('brief', value)}
          required={required}
          multiline
          rows={6}
          max={CONTENT_LIMITS.projectBriefChars}
          error={errors.errorFor(`translations.${language}.brief`)}
          disabled={pending}
        />
        <TextField
          label={t('project.requirements')}
          locale={language}
          value={draft.text[language].requirements}
          onChange={(value) => setText('requirements', value)}
          required={required}
          multiline
          rows={4}
          max={CONTENT_LIMITS.projectBriefChars}
          hint={t('project.requirementsHint')}
          error={errors.errorFor(`translations.${language}.requirements`)}
          disabled={pending}
        />
        <SubmissionTypesField
          value={draft.allowedSubmissionTypes}
          onChange={(allowedSubmissionTypes) => set({ allowedSubmissionTypes })}
          error={errors.errorUnder('allowedSubmissionTypes')}
          disabled={pending}
        />
        <RubricField
          rubric={draft.rubric}
          onChange={(rubric) => set({ rubric })}
          error={errors.errorUnder('rubric')}
          disabled={pending}
        />
        <NumberField
          label={t('project.xp')}
          value={draft.xpReward}
          onChange={(xpReward) => set({ xpReward })}
          min={0}
          max={CONTENT_LIMITS.xpRewardMax.project}
          required
          hint={t('project.xpHint', { max: CONTENT_LIMITS.xpRewardMax.project })}
          error={errors.errorFor('xpReward')}
          disabled={pending}
        />
        <Switch
          label={t('project.requiredForCertificate')}
          description={t('project.requiredForCertificateDescription')}
          checked={draft.requiredForCertificate}
          disabled={pending}
          onChange={(event) => set({ requiredForCertificate: event.target.checked })}
        />
      </Card>
      <FormAlert
        ref={alertRef}
        failure={errors.failure}
        action={
          gone ? (
            <Button size="sm" variant="secondary" loading={pending} onClick={() => void save(true)}>
              {t('project.saveAsNew')}
            </Button>
          ) : undefined
        }
      >
        {errors.otherLanguageNote && <p className="mt-1">{errors.otherLanguageNote}</p>}
      </FormAlert>
      <FormActions
        saveLabel={t('project.save')}
        pending={pending}
        onDiscard={() => {
          sync.discard();
          errors.clear();
        }}
        discardLabel={t('details.discard')}
        discardDisabled={!dirty}
      />
    </form>
  );
}
