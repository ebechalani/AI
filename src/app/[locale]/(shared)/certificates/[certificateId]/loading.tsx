import { Skeleton, Spinner } from '@/components/ui';

/** The printable certificate: the toolbar, then the landscape sheet. */
export default function CertificateLoading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-11 w-32" />
        <div className="flex-1" />
        <Skeleton className="h-11 w-32" />
        <Skeleton className="h-11 w-32" />
      </div>
      <Skeleton className="aspect-[297/210] w-full rounded-card" />
      <Spinner />
    </div>
  );
}
