import { Skeleton, Spinner } from '@/components/ui';

/** Verification: the title, then the result card. */
export default function VerifyCertificateLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <Skeleton className="h-9 w-2/3 max-w-md" />
      <Skeleton className="mt-3 h-5 w-full max-w-lg" />
      <Skeleton className="mt-8 h-64 w-full rounded-card" />
      <Spinner className="mt-8" />
    </div>
  );
}
