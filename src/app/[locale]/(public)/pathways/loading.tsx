import { CONTAINER } from '@/components/marketing';
import { Skeleton, Spinner } from '@/components/ui';

/** The pathway list and a pathway page share one shape: a heading block, then a card grid. */
export default function PathwaysLoading() {
  return (
    <div className={`${CONTAINER} flex flex-col gap-10 py-10 sm:py-14`}>
      <div className="flex max-w-3xl flex-col gap-4">
        <Skeleton className="h-10 w-2/3 max-w-sm" />
        <Skeleton lines={2} />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-56 w-full rounded-card" />
        ))}
      </div>
      <Spinner />
    </div>
  );
}
