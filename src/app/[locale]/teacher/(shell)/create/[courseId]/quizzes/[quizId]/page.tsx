import type { Metadata } from 'next';
import { firstParam } from '@/components/course-editor/paths';
import { requireRole } from '@/lib/auth/session';
import { quizMetadata } from '../../../_editor/metadata';
import { QuizEditorScreen } from '../../../_editor/QuizEditorScreen';

type Params = Promise<{ courseId: string; quizId: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  await requireRole('teacher');
  const { courseId, quizId } = await params;
  return quizMetadata('teacher', courseId, quizId);
}

// The quiz editor (ARCHITECTURE.md 6.5: the id `new` is reserved; `?lesson=` adds the block).
export default async function TeacherQuizEditorPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  await requireRole('teacher');
  const [{ courseId, quizId }, query] = await Promise.all([params, searchParams]);
  return (
    <QuizEditorScreen
      mode="teacher"
      courseId={courseId}
      quizId={quizId}
      lessonParam={firstParam(query.lesson)}
    />
  );
}
