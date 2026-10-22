import type { Metadata } from 'next';
import { parseCourseTab } from '@/components/course-editor/paths';
import { requireRole } from '@/lib/auth/session';
import { CourseEditorScreen } from '@/app/[locale]/teacher/(shell)/create/_editor/CourseEditorScreen';
import { courseMetadata } from '@/app/[locale]/teacher/(shell)/create/_editor/metadata';

type Params = Promise<{ courseId: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  await requireRole('platform_admin');
  const { courseId } = await params;
  return courseMetadata('admin', courseId);
}

// The course editor (ARCHITECTURE.md 3.7 "Course editor"): outline, details, quizzes and projects.
export default async function AdminCourseEditorPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  await requireRole('platform_admin');
  const [{ courseId }, query] = await Promise.all([params, searchParams]);
  return <CourseEditorScreen mode="admin" courseId={courseId} tab={parseCourseTab(query.tab)} />;
}
