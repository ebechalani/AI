import Form from 'next/form';
import { useTranslations } from 'next-intl';
import { Button, Card, FormField, Select, type SelectOption } from '@/components/ui';

export interface AssessmentFiltersProps {
  /** The localized path of the list: the form navigates there with the chosen filters. */
  action: string;
  classes: SelectOption[];
  classId: string;
  /** The courses assigned to the selected class; "All courses" is added here. */
  courses: SelectOption[];
  courseId: string | null;
}

/**
 * Class and course, sent as a GET form: applying always starts at page 1. Keyed by the resolved
 * filters, so the uncontrolled selects show them again after a navigation to the same route.
 */
export function AssessmentFilters({
  action,
  classes,
  classId,
  courses,
  courseId,
}: AssessmentFiltersProps) {
  const t = useTranslations('assessments');
  const tCommon = useTranslations('common');

  return (
    <Card className="mb-6">
      <Form
        key={`${classId}:${courseId ?? ''}`}
        action={action}
        aria-label={t('filters.label')}
        className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
      >
        <FormField label={t('filters.class')}>
          <Select name="classId" defaultValue={classId} options={classes} />
        </FormField>
        <FormField label={t('filters.course')}>
          <Select
            name="courseId"
            defaultValue={courseId ?? ''}
            options={[{ value: '', label: t('filters.allCourses') }, ...courses]}
          />
        </FormField>
        {/* A bare grid item: full width on a phone, as wide as its label in the auto column. */}
        <Button type="submit" variant="secondary">
          {tCommon('actions.apply')}
        </Button>
      </Form>
    </Card>
  );
}
