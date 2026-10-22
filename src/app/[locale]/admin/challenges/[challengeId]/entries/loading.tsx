import { Skeleton, Spinner } from '@/components/ui';

/** The entries of a challenge: breadcrumb, header with its button, then the table. */
export default function AdminChallengeEntriesLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-56" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex w-full max-w-md flex-col gap-3">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-5 w-full" />
          </div>
          <Skeleton className="h-11 w-40" />
        </div>
      </div>
      <Skeleton className="h-64 w-full rounded-card" />
      <Spinner />
    </div>
  );
}
