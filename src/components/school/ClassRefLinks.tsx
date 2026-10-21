import { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { schoolClassPath } from './paths';
import type { ClassRef } from './people-model';

const LINK =
  'rounded-sm break-words text-ink underline-offset-4 hover:text-brand-700 hover:underline';

/** Class links separated by commas, archived ones marked; `empty` when there is none. */
export function ClassRefLinks({ classes, empty }: { classes: ClassRef[]; empty: string }) {
  const t = useTranslations('school');
  if (classes.length === 0) return <span className="text-ink-muted">{empty}</span>;
  return (
    <>
      {classes.map((cls, index) => (
        <Fragment key={cls.id}>
          {index > 0 && ', '}
          <Link href={schoolClassPath(cls.id)} className={LINK}>
            {cls.archived ? t('classes.archivedName', { name: cls.name }) : cls.name}
          </Link>
        </Fragment>
      ))}
    </>
  );
}
