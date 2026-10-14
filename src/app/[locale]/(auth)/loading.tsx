import { Skeleton, Spinner } from '@/components/ui';

export default function AuthLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-1/2" />
      <Skeleton lines={2} className="mt-4" />
      <Skeleton className="mt-6 h-11 w-full" />
      <Skeleton className="mt-3 h-11 w-full" />
      <Spinner className="mt-6" />
    </div>
  );
}
