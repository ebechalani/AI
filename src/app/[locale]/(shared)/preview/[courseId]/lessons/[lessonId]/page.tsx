import { LessonPlayer } from '@/components/lesson/LessonPlayer';
import { requireRole } from '@/lib/auth/session';

export default async function PreviewLessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const session = await requireRole('school_admin', 'platform_admin');
  const { courseId, lessonId } = await params;

  return (
    <LessonPlayer
      courseId={courseId}
      lessonId={lessonId}
      lessonBasePath={`/preview/${courseId}/lessons`}
      exitHref={
        session.role === 'platform_admin' ? `/admin/courses/${courseId}` : '/school/courses'
      }
    />
  );
}
