import type { Metadata } from 'next';
import { firstParam } from '@/components/course-editor/paths';
import { requireRole } from '@/lib/auth/session';
import { quizMetadata } from '@/app/[locale]/teacher/(shell)/create/_editor/metadata';
import { QuizEditorScreen } from '@/app/[locale]/teacher/(shell)/create/_editor/QuizEditorScreen';

type Params = Promise<{ courseId: string; quizId: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  await requireRole('platform_admin');
  const { courseId, quizId } = await params;
  return quizMetadata('admin', courseId, quizId);
}

// The quiz editor (ARCHITECTURE.md 6.5: the id `new` is reserved; `?lesson=` adds the block).
export default async function AdminQuizEditorPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  await requireRole('platform_admin');
  const [{ courseId, quizId }, query] = await Promise.all([params, searchParams]);
  return (
    <QuizEditorScreen
      mode="admin"
      courseId={courseId}
      quizId={quizId}
      lessonParam={firstParam(query.lesson)}
    />
  );
}
