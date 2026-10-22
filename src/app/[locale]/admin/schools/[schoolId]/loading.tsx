import { Skeleton, Spinner } from '@/components/ui';

/** A school's page: breadcrumb, header, the overview card, four tiles, two sections. */
export default function AdminSchoolLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-40" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <Skeleton className="h-9 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-11 w-32" />
            <Skeleton className="h-11 w-36" />
          </div>
        </div>
      </div>
      <Skeleton className="h-48 w-full rounded-card" />
      <div className="grid grid-cols-1 gap-4 min-[440px]:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((tile) => (
          <Skeleton key={tile} className="h-24 w-full rounded-card" />
        ))}
      </div>
      <Skeleton className="h-40 w-full rounded-card" />
      <Skeleton className="h-40 w-full rounded-card" />
      <Spinner />
    </div>
  );
}
