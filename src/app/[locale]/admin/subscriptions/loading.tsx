import { Skeleton, Spinner } from '@/components/ui';

/** Subscriptions and licenses: header with its button, the two tabs, then the table. */
export default function AdminSubscriptionsLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex w-full max-w-md flex-col gap-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-full" />
        </div>
        <Skeleton className="h-11 w-40" />
      </div>
      <div className="flex flex-wrap gap-2">
        {[0, 1].map((tab) => (
          <Skeleton key={tab} className="h-9 w-32 rounded-control" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-card" />
      <Spinner />
    </div>
  );
}
