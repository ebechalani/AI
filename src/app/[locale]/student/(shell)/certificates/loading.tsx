import { Skeleton, Spinner } from '@/components/ui';

/** The certificate list: the header, then two cards. */
export default function StudentCertificatesLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-52 w-full rounded-card" />
        <Skeleton className="h-52 w-full rounded-card" />
      </div>
      <Spinner />
    </div>
  );
}
