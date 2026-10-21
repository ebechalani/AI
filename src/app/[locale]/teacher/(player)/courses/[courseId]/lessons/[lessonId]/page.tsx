import type { Metadata } from 'next';
import { LessonPlayer, lessonMetadata } from '@/components/lesson/LessonPlayer';
import { requireRole } from '@/lib/auth/session';

type Params = Promise<{ courseId: string; lessonId: string }>;

// The lesson's title, or the not-found page (one cached read, shared with the player).
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  await requireRole('teacher');
  const { courseId, lessonId } = await params;
  return lessonMetadata(courseId, lessonId);
}

// Learning in an enrolled Teacher Academy course, read-only preview otherwise; the server
// decides inside LessonPlayer (ARCHITECTURE.md 7.6).
export default async function TeacherLessonPage({ params }: { params: Params }) {
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
