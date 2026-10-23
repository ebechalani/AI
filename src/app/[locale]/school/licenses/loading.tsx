import { Skeleton, Spinner } from '@/components/ui';

/** Licenses: header, the seats card, then two licence cards. */
export default function SchoolLicensesLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex w-full max-w-md flex-col gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-full" />
      </div>
      <Skeleton className="h-44 w-full max-w-xl rounded-card" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-32" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-56 w-full rounded-card" />
          <Skeleton className="h-56 w-full rounded-card" />
        </div>
      </div>
      <Spinner />
    </div>
  );
}
