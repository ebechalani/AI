import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LessonPlayer } from '@/components/lesson/LessonPlayer';
import { requireRole } from '@/lib/auth/session';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('pages.lesson') };
}

// A student learns when enrolled and gets the read-only preview otherwise; the server decides
// inside LessonPlayer (ARCHITECTURE.md 7.6).
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
