import { Skeleton, Spinner } from '@/components/ui';

/** Settings: header, then the profile and the features form cards. */
export default function SchoolSettingsLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex w-full max-w-md flex-col gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-full" />
      </div>
      <div className="flex max-w-3xl flex-col gap-8">
        <Skeleton className="h-80 w-full rounded-card" />
        <Skeleton className="h-72 w-full rounded-card" />
      </div>
      <Spinner />
    </div>
  );
}
