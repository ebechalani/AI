import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth/session';
import { LessonEditorScreen } from '../../../_editor/LessonEditorScreen';
import { lessonMetadata } from '../../../_editor/metadata';

type Params = Promise<{ courseId: string; lessonId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  await requireRole('teacher');
  const { courseId, lessonId } = await params;
  return lessonMetadata('teacher', courseId, lessonId);
}

// The lesson editor (ARCHITECTURE.md 3.7 "Course editor"): the blocks and the lesson's details.
export default async function TeacherLessonEditorPage({ params }: { params: Params }) {
  await requireRole('teacher');
  const { courseId, lessonId } = await params;
  return <LessonEditorScreen mode="teacher" courseId={courseId} lessonId={lessonId} />;
}
