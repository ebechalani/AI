import type { Metadata } from 'next';
import { firstParam } from '@/components/course-editor/paths';
import { requireRole } from '@/lib/auth/session';
import { projectMetadata } from '../../../_editor/metadata';
import { ProjectEditorScreen } from '../../../_editor/ProjectEditorScreen';

type Params = Promise<{ courseId: string; projectId: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  await requireRole('teacher');
  const { courseId, projectId } = await params;
  return projectMetadata('teacher', courseId, projectId);
}

// The project editor (ARCHITECTURE.md 6.5: the id `new` is reserved; `?lesson=` adds the block).
export default async function TeacherProjectEditorPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  await requireRole('teacher');
  const [{ courseId, projectId }, query] = await Promise.all([params, searchParams]);
  return (
    <ProjectEditorScreen
      mode="teacher"
      courseId={courseId}
      projectId={projectId}
      lessonParam={firstParam(query.lesson)}
    />
  );
}
