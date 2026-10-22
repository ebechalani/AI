'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useDurationFormat } from '@/components/domain';
import { Chip, FormField, Input, RadioGroup, Select, Switch } from '@/components/ui';
import { CONTENT_LIMITS } from '@/lib/limits';
import { AUDIENCES, LEARNING_AREAS, type Audience, type LearningArea } from '@/types/common';
import type { Course } from '@/types/content';
import { pathwayFitsAudience, tagsFromText, type CourseDraft } from './course-model';
import { NumberField } from './NumberField';
import { pathwayLabel } from './PathwaySelect';
import type { PathwayOption } from './rows';

export interface CourseSettingsFieldsProps {
  draft: CourseDraft;
  set(patch: Partial<CourseDraft>): void;
  course: Course;
  official: boolean;
  admin: boolean;
  /** A lesson of the course has a project block: it stays a course for students. */
  hasProjectBlocks: boolean;
  pathways: readonly PathwayOption[];
  errorFor(path: string): string | undefined;
  errorUnder(prefix: string): string | undefined;
  disabled: boolean;
  formId: string;
}

/** Audience, topic, ages, time, tags, visibility and certificate (6.2.4). */
export function CourseSettingsFields({
  draft,
  set,
  course,
  official,
  admin,
  hasProjectBlocks,
  pathways,
  errorFor,
  errorUnder,
  disabled,
  formId,
}: CourseSettingsFieldsProps) {
  const t = useTranslations('courseEditor');
  const tDomain = useTranslations('domain');
  const locale = useLocale();
  const formatDuration = useDurationFormat();
  const teacherCourse = draft.audience === 'teacher';
  const projectsLock = hasProjectBlocks && course.audience === 'student';
  // While published, the pathway is fixed, so the audience it does not serve is out of reach.
  const pathway = pathways.find((option) => option.id === draft.pathwayId);
  const pathwayLock =
    official && admin && course.status === 'published' && pathway !== undefined ? pathway : null;
  const minutes = Number(draft.estimatedMinutes);
  const tags = tagsFromText(draft.tags);

  function chooseAudience(value: string) {
    const audience = value as Audience;
    set({
      audience,
      ...(audience === 'teacher' && { ageMin: '', ageMax: '' }),
      ...(official &&
        admin &&
        !pathwayFitsAudience(draft.pathwayId, audience, pathways) && { pathwayId: '' }),
    });
  }

  const audienceHints = [
    projectsLock ? t('fields.audienceLocked') : null,
    pathwayLock ? t('fields.audiencePathway', { pathway: pathwayLabel(pathwayLock, locale) }) : null,
  ].filter((hint) => hint !== null);

  return (
    <>
      <RadioGroup
        legend={t('fields.audience')}
        name={`${formId}-audience`}
        value={draft.audience}
        onValueChange={chooseAudience}
        hint={audienceHints.length > 0 ? audienceHints.join(' ') : undefined}
        error={errorFor('audience')}
        disabled={disabled}
        options={AUDIENCES.map((audience) => ({
          value: audience,
          label: t(`fields.audienceOptions.${audience}`),
          description: t(`fields.audienceOptions.${audience}Description`),
          disabled:
            (audience === 'teacher' && projectsLock) ||
            (pathwayLock !== null && pathwayLock.audience !== audience),
        }))}
      />
      <FormField label={t('fields.area')} error={errorFor('area')}>
        <Select
          value={draft.area}
          disabled={disabled}
          onChange={(event) => set({ area: event.target.value as LearningArea })}
          options={LEARNING_AREAS.map((area) => ({ value: area, label: tDomain(`areas.${area}`) }))}
        />
      </FormField>
      {!teacherCourse && (
        <fieldset className="min-w-0">
          <legend className="mb-2 text-sm font-semibold text-ink">{t('fields.agesLegend')}</legend>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label={t('fields.ageMin')}
              value={draft.ageMin}
              onChange={(value) => set({ ageMin: value })}
              min={CONTENT_LIMITS.ageMin}
              max={CONTENT_LIMITS.ageMax}
              error={errorFor('ageMin')}
              disabled={disabled}
            />
            <NumberField
              label={t('fields.ageMax')}
              value={draft.ageMax}
              onChange={(value) => set({ ageMax: value })}
              min={CONTENT_LIMITS.ageMin}
              max={CONTENT_LIMITS.ageMax}
              error={errorFor('ageMax')}
              disabled={disabled}
            />
          </div>
          <p className="mt-1.5 text-sm text-ink-muted">
            {t('fields.agesHint', { min: CONTENT_LIMITS.ageMin, max: CONTENT_LIMITS.ageMax })}
          </p>
        </fieldset>
      )}
      <NumberField
        label={t('fields.minutes')}
        value={draft.estimatedMinutes}
        onChange={(value) => set({ estimatedMinutes: value })}
        min={0}
        max={CONTENT_LIMITS.courseMinutesMax}
        required
        hint={t('fields.minutesHint', {
          max: CONTENT_LIMITS.courseMinutesMax,
          duration: formatDuration(Number.isFinite(minutes) ? minutes : 0),
        })}
        error={errorFor('estimatedMinutes')}
        disabled={disabled}
      />
      <FormField
        label={t('fields.tags')}
        hint={
          <>
            <span className="block">{t('fields.tagsHint', { max: CONTENT_LIMITS.tagsPerCourse })}</span>
            {tags.length > 0 && (
              <span className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((tag, index) => (
                  <Chip key={`${tag}-${index}`}>{tag}</Chip>
                ))}
              </span>
            )}
          </>
        }
        error={errorUnder('tags')}
      >
        <Input
          value={draft.tags}
          disabled={disabled}
          onChange={(event) => set({ tags: event.target.value })}
        />
      </FormField>
      {!official &&
        (course.schoolId === null ? (
          <div>
            <p className="mb-1 text-sm font-semibold text-ink">{t('fields.visibility')}</p>
            <p className="text-sm text-ink-muted">{t('fields.visibilityNoSchool')}</p>
          </div>
        ) : (
          <RadioGroup
            legend={t('fields.visibility')}
            name={`${formId}-visibility`}
            value={draft.visibility}
            onValueChange={(value) => set({ visibility: value as CourseDraft['visibility'] })}
            error={errorFor('visibility')}
            disabled={disabled}
            options={(['private', 'school'] as const).map((visibility) => ({
              value: visibility,
              label: t(`fields.visibilityOptions.${visibility}`),
              description: t(`fields.visibilityOptions.${visibility}Description`),
            }))}
          />
        ))}
      <Switch
        label={t('fields.certificate')}
        description={t('fields.certificateDescription')}
        checked={draft.certificateEnabled}
        disabled={disabled}
        onChange={(event) => set({ certificateEnabled: event.target.checked })}
      />
    </>
  );
}
