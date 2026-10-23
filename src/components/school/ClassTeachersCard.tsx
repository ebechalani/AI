import { useTranslations } from 'next-intl';
import { StatusChip } from '@/components/domain';
import { Card, Chip } from '@/components/ui';
import type { ClassTeacher, TeacherPicker } from './class-admin-model';
import { EditClassTeachersButton } from './EditClassTeachersButton';

export interface ClassTeachersCardProps {
  classId: string;
  className: string;
  teachers: ClassTeacher[];
  picker: TeacherPicker;
  /** An archived class: no change control. */
  readOnly: boolean;
}

/** Who teaches the class (the owner first), and the way to change it. */
export function ClassTeachersCard({
  classId,
  className,
  teachers,
  picker,
  readOnly,
}: ClassTeachersCardProps) {
  const t = useTranslations('school');

  return (
    <Card as="section" aria-labelledby="class-teachers-title" className="gap-4 p-5 sm:p-6">
      <h2 id="class-teachers-title" className="text-xl font-bold text-ink">
        {t('class.teachers.title')}
      </h2>
      <ul className="flex flex-col gap-2">
        {teachers.map((teacher) => (
          <li key={teacher.uid} className="flex flex-wrap items-center gap-2">
            <span className="min-w-0 font-medium break-words text-ink">
              {teacher.name ?? t('class.teachers.unknown')}
            </span>
            {teacher.owner && (
              <Chip tone="brand" size="sm">
                {t('class.teachers.owner')}
              </Chip>
            )}
            {teacher.disabled && <StatusChip status="disabled" size="sm" />}
          </li>
        ))}
      </ul>
      {!readOnly &&
        (picker.ownerDisabled ? (
          <p className="text-sm text-ink-muted">{t('class.teachers.ownerDisabled')}</p>
        ) : (
          <div>
            <EditClassTeachersButton classId={classId} className={className} picker={picker} />
          </div>
        ))}
    </Card>
  );
}
