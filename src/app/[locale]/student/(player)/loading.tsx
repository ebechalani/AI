import { Spinner } from '@/components/ui';

export default function StudentPlayerLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <Spinner size="lg" />
    </div>
  );
}
