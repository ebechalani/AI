import type { Metadata } from 'next';
import { LessonPlayer, lessonMetadata } from '@/components/lesson/LessonPlayer';
import { requireRole } from '@/lib/auth/session';

type Params = Promise<{ courseId: string; lessonId: string }>;

// The lesson's title, or the not-found page (one cached read, shared with the player).
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  await requireRole('school_admin', 'platform_admin');
  const { courseId, lessonId } = await params;
  return lessonMetadata(courseId, lessonId);
}

// The read-only lesson preview of school and platform admins (ARCHITECTURE.md 6.3): the server
// always answers readOnly for these roles.
export default async function PreviewLessonPage({ params }: { params: Params }) {
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
