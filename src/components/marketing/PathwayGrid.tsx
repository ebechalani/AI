import { Route } from 'lucide-react';
import { PathwayCard } from '@/components/domain';
import { EmptyState } from '@/components/ui';
import type { Pathway } from '@/types/content';

export interface PathwayGridProps {
  pathways: readonly Pathway[];
  emptyTitle: string;
  emptyDescription: string;
}

/** The public pathway cards, each linking to its public detail page. */
export function PathwayGrid({ pathways, emptyTitle, emptyDescription }: PathwayGridProps) {
  if (pathways.length === 0) {
    return <EmptyState icon={<Route />} title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {pathways.map((pathway) => (
        <li key={pathway.id} className="min-w-0">
          <PathwayCard pathway={pathway} href={`/pathways/${pathway.id}`} />
        </li>
      ))}
    </ul>
  );
}
