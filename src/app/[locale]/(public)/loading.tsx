import { Skeleton, Spinner } from '@/components/ui';

export default function PublicLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Skeleton className="h-9 w-2/3 max-w-md" />
      <Skeleton lines={3} className="mt-6 max-w-2xl" />
      <Spinner className="mt-8" />
    </div>
  );
}
