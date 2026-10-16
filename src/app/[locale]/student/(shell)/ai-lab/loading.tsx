import { Skeleton, Spinner } from '@/components/ui';

function CardGrid({ count }: { count: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-44 w-full rounded-card" />
      ))}
    </div>
  );
}

/** The AI Lab: the header, the safety note, then two headed grids of tool cards. */
export default function StudentAiLabLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-40" />
        <Skeleton lines={2} className="max-w-2xl" />
      </div>
      <Skeleton className="h-14 w-full rounded-control" />
      <Skeleton className="h-7 w-40" />
      <CardGrid count={6} />
      <Skeleton className="h-7 w-40" />
      <CardGrid count={2} />
      <Spinner />
    </div>
  );
}
