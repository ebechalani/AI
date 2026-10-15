import { Route } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PathwayCard } from '@/components/domain';
import { EmptyState } from '@/components/ui';
import type { PathwayProgressItem } from './home-model';

export interface MyPathwaysProps {
  items: readonly PathwayProgressItem[];
}

/** The pathways of the student's courses, with the courses completed in each. */
export function MyPathways({ items }: MyPathwaysProps) {
  const t = useTranslations('student');

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Route />}
        title={t('pathways.empty.title')}
        description={t('pathways.empty.description')}
      />
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {items.map(({ pathway, completed, total }) => (
        <li key={pathway.id} className="min-w-0">
          <PathwayCard
            pathway={pathway}
            href={`/student/learn/pathways/${pathway.id}`}
            progress={{ completed, total }}
          />
        </li>
      ))}
    </ul>
  );
}
