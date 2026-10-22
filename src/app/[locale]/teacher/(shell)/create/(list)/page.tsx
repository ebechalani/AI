import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { requireRole } from '@/lib/auth/session';
import { CourseListScreen } from '../_editor/CourseListScreen';

export async function generateMetadata(): Promise<Metadata> {
  await requireRole('teacher');
  const t = await getTranslations('courseEditor');
  return { title: t('list.title') };
}

// The course list of this area (ARCHITECTURE.md 6.5 / 6.7, 3.7 "Course editor").
export default async function TeacherCourseListPage() {
  await requireRole('teacher');
  return <CourseListScreen mode="teacher" />;
}
