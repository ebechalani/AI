import Form from 'next/form';
import { useTranslations } from 'next-intl';
import { Button, Card, FormField, Select } from '@/components/ui';
import type { ClassOption } from './reports-model';

export interface ReportFiltersProps {
  /** The localized path of the reports page: the form navigates there with the choice. */
  action: string;
  classes: ClassOption[];
  classId: string;
  /** The selected class's assigned courses, in assignment order. */
  courses: { value: string; label: string }[];
  courseId: string;
}

/**
 * Class and course, sent as a GET form. Keyed by the resolved choice, so the uncontrolled
 * selects show it again after a navigation to the same route.
 */
export function ReportFilters({ action, classes, classId, courses, courseId }: ReportFiltersProps) {
  const t = useTranslations('reports');

  return (
    <Card className="mb-6">
      <Form
        key={`${classId}:${courseId}`}
        action={action}
        aria-label={t('filters.label')}
        className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
      >
        <FormField label={t('filters.class')}>
          <Select
            name="classId"
            defaultValue={classId}
            options={classes.map((option) => ({
              value: option.value,
              label: option.archived
                ? t('filters.archivedClass', { name: option.name })
                : option.name,
            }))}
          />
        </FormField>
        <FormField label={t('filters.course')}>
          {courses.length === 0 ? (
            <Select name="courseId" disabled defaultValue="">
              <option value="">{t('filters.noCourse')}</option>
            </Select>
          ) : (
            <Select name="courseId" defaultValue={courseId} options={courses} />
          )}
        </FormField>
        <Button type="submit" variant="secondary">
          {t('filters.apply')}
        </Button>
      </Form>
    </Card>
  );
}
