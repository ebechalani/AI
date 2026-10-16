import { Skeleton, Spinner } from '@/components/ui';

/** Settings: the header and three section cards. */
export default function StudentSettingsLoading() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-full max-w-md" />
      </div>
      <Skeleton className="h-56 w-full rounded-card" />
      <Skeleton className="h-56 w-full rounded-card" />
      <Skeleton className="h-56 w-full rounded-card" />
      <Spinner />
    </div>
  );
}
