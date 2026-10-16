import { useTranslations } from 'next-intl';
import { Button, FormField, Select } from '@/components/ui';
import type { SchoolClass } from '@/types';

export interface ClassFilterFormProps {
  classes: SchoolClass[];
  classId: string;
}

/**
 * The class of the All view, as a plain GET form with no `action`: it goes to the current,
 * locale-prefixed URL, and a new class starts at its first page (no `cursors`).
 */
export function ClassFilterForm({ classes, classId }: ClassFilterFormProps) {
  const t = useTranslations('review');
  return (
    <form method="get" className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="view" value="all" />
      <FormField label={t('all.classLabel')} className="w-full max-w-sm sm:w-auto sm:min-w-64">
        <Select
          name="class"
          defaultValue={classId}
          options={classes.map((cls) => ({
            value: cls.id,
            label: cls.archived ? t('all.archived', { name: cls.name }) : cls.name,
          }))}
        />
      </FormField>
      <Button type="submit" variant="secondary">
        {t('all.show')}
      </Button>
    </form>
  );
}
