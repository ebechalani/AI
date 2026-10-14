import { Skeleton, Spinner } from '@/components/ui';

export default function SchoolLoading() {
  return (
    <div>
      <Skeleton className="h-9 w-1/2 max-w-sm" />
      <Skeleton lines={2} className="mt-4 max-w-xl" />
      <Skeleton className="mt-8 h-40 w-full rounded-card" />
      <Spinner className="mt-8" />
    </div>
  );
}
