import type { Metadata } from 'next';
import { firstParam } from '@/components/course-editor/paths';
import { requireRole } from '@/lib/auth/session';
import { projectMetadata } from '@/app/[locale]/teacher/(shell)/create/_editor/metadata';
import { ProjectEditorScreen } from '@/app/[locale]/teacher/(shell)/create/_editor/ProjectEditorScreen';

type Params = Promise<{ courseId: string; projectId: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  await requireRole('platform_admin');
  const { courseId, projectId } = await params;
  return projectMetadata('admin', courseId, projectId);
}

// The project editor (ARCHITECTURE.md 6.5: the id `new` is reserved; `?lesson=` adds the block).
export default async function AdminProjectEditorPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  await requireRole('platform_admin');
  const [{ courseId, projectId }, query] = await Promise.all([params, searchParams]);
  return (
    <ProjectEditorScreen
      mode="admin"
      courseId={courseId}
      projectId={projectId}
      lessonParam={firstParam(query.lesson)}
    />
  );
}
