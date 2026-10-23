import { Skeleton, Spinner } from '@/components/ui';

/** A challenge's page: breadcrumb, header, the status card, then the form's sections. */
export default function AdminChallengeLoading() {
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-64" />
      </div>
      <Skeleton className="h-32 w-full rounded-card" />
      {[0, 1, 2, 3].map((block) => (
        <Skeleton key={block} className="h-48 w-full rounded-card" />
      ))}
      <Spinner />
    </div>
  );
}
