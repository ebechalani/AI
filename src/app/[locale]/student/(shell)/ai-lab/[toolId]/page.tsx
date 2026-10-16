import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FlaskConicalOff } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { isMockToolId, STATUS_TONE } from '@/components/ai/lab-model';
import { LabHowItWorks } from '@/components/ai/LabHowItWorks';
import { LabMockTool } from '@/components/ai/LabMockTool';
import { LabTextTool } from '@/components/ai/LabTextTool';
import { NamedIcon } from '@/components/domain';
import { PageHeader } from '@/components/layout';
import { Chip, EmptyState, LinkButton } from '@/components/ui';
import { getLabTool, isLabToolId } from '@/lib/ai/lab-tools';
import { requireRole } from '@/lib/auth/session';
import { aiLabEnabled } from '../_components/load';

// The text tool's server action runs from this page: the provider call is bounded at 50 s.
export const maxDuration = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ toolId: string }>;
}): Promise<Metadata> {
  const { toolId } = await params;
  if (!isLabToolId(toolId)) {
    const t = await getTranslations('nav');
    return { title: t('student.aiLab') };
  }
  const t = await getTranslations('aiLab');
  return { title: t(`tools.${toolId}.title`) };
}

// One AI Lab tool (ARCHITECTURE.md 8.5): the live text tool, a demo tool, or a tool to come.
export default async function StudentAiLabToolPage({
  params,
}: {
  params: Promise<{ toolId: string }>;
}) {
  const session = await requireRole('student');
  const { toolId } = await params;
  if (!isLabToolId(toolId)) notFound();
  const tool = getLabTool(toolId);
  const [enabled, t, tNav] = await Promise.all([
    aiLabEnabled(session),
    getTranslations('aiLab'),
    getTranslations('nav'),
  ]);
  const title = t(`tools.${tool.id}.title`);

  const header = (
    <PageHeader
      title={title}
      description={t(`tools.${tool.id}.description`)}
      breadcrumbs={[{ label: tNav('student.aiLab'), href: '/student/ai-lab' }, { label: title }]}
      actions={
        <Chip tone={STATUS_TONE[tool.status]} icon={<NamedIcon name={tool.icon} />}>
          {t(`status.${tool.status}`)}
        </Chip>
      }
    />
  );

  if (!enabled) {
    return (
      <>
        {header}
        <EmptyState
          icon={<FlaskConicalOff />}
          title={t('disabled.title')}
          description={t('disabled.description')}
          action={<LinkButton href="/student/learn">{t('disabled.action')}</LinkButton>}
        />
      </>
    );
  }

  if (tool.status === 'coming_soon') {
    return (
      <>
        {header}
        <EmptyState
          icon={<NamedIcon name={tool.icon} />}
          title={t('comingSoon')}
          description={t('comingSoonDescription')}
          action={<LinkButton href="/student/ai-lab">{t('backToLab')}</LinkButton>}
        />
      </>
    );
  }

  const live = tool.status === 'live';
  return (
    <>
      {header}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {live ? (
          <LabTextTool />
        ) : (
          isMockToolId(tool.id) && <LabMockTool toolId={tool.id} icon={tool.icon} />
        )}
        <aside className="min-w-0">
          <LabHowItWorks status={live ? 'live' : 'mock'} tips={live} />
        </aside>
      </div>
    </>
  );
}
