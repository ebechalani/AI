import { FolderKanban, Zap } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { ProjectBrief } from '@/components/projects/ProjectBrief';
import { ProjectSubmissionPanel } from '@/components/projects/ProjectSubmissionPanel';
import { projectBrief } from '@/components/projects/projects-model';
import { Card, Chip } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import type { BlockRendererProps } from './registry';

/**
 * A project of the lesson (ARCHITECTURE.md 7.6, SPEC-D 6): its brief, then the form or where the
 * student's latest attempt stands. It reads only the runtime; read-only shows no form.
 */
export function ProjectBlock({ block, runtime }: BlockRendererProps<'project'>) {
  const locale = useLocale();
  const t = useTranslations('projects');
  const tDomain = useTranslations('domain');
  const { projectId } = block.data;
  const project = Object.hasOwn(runtime.projects, projectId)
    ? runtime.projects[projectId]
    : undefined;
  const latest = Object.hasOwn(runtime.latestSubmissions, projectId)
    ? (runtime.latestSubmissions[projectId] ?? null)
    : null;
  const intro = pickTranslation(block.translations, locale, block.defaultLocale).intro;

  if (project === undefined) {
    return (
      <Card>
        <p className="p-5 text-ink-muted sm:p-6">{t('block.unavailable')}</p>
      </Card>
    );
  }

  const brief = projectBrief(project, locale);
  return (
    <Card>
      <div className="flex min-w-0 flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h3 className="min-w-0 text-lg leading-snug font-semibold break-words text-ink">
            {brief.title}
          </h3>
          <Chip tone="accent" icon={<FolderKanban aria-hidden="true" />}>
            {t(`block.kinds.${project.kind}`)}
          </Chip>
          <Chip tone="brand" icon={<Zap aria-hidden="true" />}>
            {tDomain('xp.amount', { xp: project.xpReward })}
          </Chip>
        </div>
        {typeof intro === 'string' && intro.trim() !== '' && (
          <p className="break-words whitespace-pre-line text-ink-muted">{intro}</p>
        )}
        <ProjectBrief
          text={brief}
          allowedTypes={project.allowedSubmissionTypes}
          headingLevel="h4"
        />
        {/* Block ids are unique per lesson only, so the key carries the lesson. */}
        <ProjectSubmissionPanel
          key={`${runtime.lessonId}/${block.id}`}
          courseId={runtime.courseId}
          projectId={project.id}
          allowedTypes={project.allowedSubmissionTypes}
          latest={latest}
          readOnly={runtime.readOnly}
        />
      </div>
    </Card>
  );
}
