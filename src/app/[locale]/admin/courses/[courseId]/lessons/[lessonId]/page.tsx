import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth/session';
import { LessonEditorScreen } from '@/app/[locale]/teacher/(shell)/create/_editor/LessonEditorScreen';
import { lessonMetadata } from '@/app/[locale]/teacher/(shell)/create/_editor/metadata';

type Params = Promise<{ courseId: string; lessonId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  await requireRole('platform_admin');
  const { courseId, lessonId } = await params;
  return lessonMetadata('admin', courseId, lessonId);
}

// The lesson editor (ARCHITECTURE.md 3.7 "Course editor"): the blocks and the lesson's details.
export default async function AdminLessonEditorPage({ params }: { params: Params }) {
  await requireRole('platform_admin');
  const { courseId, lessonId } = await params;
  return <LessonEditorScreen mode="admin" courseId={courseId} lessonId={lessonId} />;
}
