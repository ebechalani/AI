import { Skeleton, Spinner } from '@/components/ui';

/** A new challenge: breadcrumb, header, then the form's sections. */
export default function AdminNewChallengeLoading() {
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-full max-w-md" />
      </div>
      {[0, 1, 2, 3].map((block) => (
        <Skeleton key={block} className="h-48 w-full rounded-card" />
      ))}
      <Spinner />
    </div>
  );
}
