import { Skeleton, Spinner } from '@/components/ui';

/**
 * The dashboard's skeleton: header, stat tiles and section cards. Also the area's fallback for
 * any admin route without a loading file of its own, so it carries no text.
 */
export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex w-full max-w-md flex-col gap-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton lines={2} />
      </div>
      <div className="grid grid-cols-1 gap-4 min-[440px]:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((tile) => (
          <Skeleton key={tile} className="h-24 w-full rounded-card" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((card) => (
          <Skeleton key={card} className="h-32 w-full rounded-card" />
        ))}
      </div>
      <Spinner />
    </div>
  );
}
