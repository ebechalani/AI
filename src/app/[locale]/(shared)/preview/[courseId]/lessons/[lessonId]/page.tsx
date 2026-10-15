import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LessonPlayer } from '@/components/lesson/LessonPlayer';
import { requireRole } from '@/lib/auth/session';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('pages.lesson') };
}

// The read-only lesson preview of school and platform admins (ARCHITECTURE.md 6.3): the server
// always answers readOnly for these roles.
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
