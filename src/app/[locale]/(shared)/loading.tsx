import { Skeleton, Spinner } from '@/components/ui';

export default function SharedLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton lines={4} className="mt-6" />
      <Spinner className="mt-8" />
    </div>
  );
}
