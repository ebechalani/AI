import { LessonPlayer } from '@/components/lesson/LessonPlayer';
import { requireRole } from '@/lib/auth/session';

export default async function StudentLessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  await requireRole('student');
  const { courseId, lessonId } = await params;

  return (
    <LessonPlayer
      courseId={courseId}
      lessonId={lessonId}
      lessonBasePath={`/student/learn/courses/${courseId}/lessons`}
      exitHref={`/student/learn/courses/${courseId}`}
    />
  );
}
