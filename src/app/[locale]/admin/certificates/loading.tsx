import { Skeleton, Spinner } from '@/components/ui';

/** The certificates list: header, then the table. */
export default function AdminCertificatesLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex w-full max-w-md flex-col gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-full" />
      </div>
      <Skeleton className="h-64 w-full rounded-card" />
      <Spinner />
    </div>
  );
}
