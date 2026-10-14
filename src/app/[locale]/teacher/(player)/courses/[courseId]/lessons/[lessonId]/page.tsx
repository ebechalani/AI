import { LessonPlayer } from '@/components/lesson/LessonPlayer';
import { requireRole } from '@/lib/auth/session';

// Learning in an enrolled Teacher Academy course, read-only preview otherwise; the server
// decides inside LessonPlayer (ARCHITECTURE.md 7.6).
export default async function TeacherLessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  await requireRole('teacher');
  const { courseId, lessonId } = await params;

  return (
    <LessonPlayer
      courseId={courseId}
      lessonId={lessonId}
      lessonBasePath={`/teacher/courses/${courseId}/lessons`}
      exitHref={`/teacher/courses/${courseId}`}
    />
  );
}
