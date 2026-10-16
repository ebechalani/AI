import type { Metadata } from 'next';
import { FlaskConicalOff } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { groupLabTools, labToolHref } from '@/components/ai/lab-model';
import { LabToolCard } from '@/components/ai/LabToolCard';
import { PageHeader } from '@/components/layout';
import { Alert, EmptyState, LinkButton } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { aiLabEnabled } from './_components/load';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('student.aiLab') };
}

// The AI Lab (ARCHITECTURE.md 6.4, 8.5): the tools a learner can try, and the ones to come. The
// registry is code, so the cards need no read; the school's AI switch is the only one.
export default async function StudentAiLabPage() {
  const session = await requireRole('student');
  const [enabled, t, tNav] = await Promise.all([
    aiLabEnabled(session),
    getTranslations('aiLab'),
    getTranslations('nav'),
  ]);
  const header = (
    <PageHeader title={tNav('student.aiLab')} description={t('overview.description')} />
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

  const { available, comingSoon } = groupLabTools();
  return (
    <>
      {header}
      <div className="flex flex-col gap-10">
        <Alert tone="info" live="off">
          {t('overview.safety')}
        </Alert>
        <section aria-labelledby="lab-tools">
          <h2 id="lab-tools" className="text-xl font-semibold text-ink">
            {t('sections.tryIt')}
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {available.map((tool) => (
              <li key={tool.id}>
                <LabToolCard tool={tool} href={labToolHref(tool.id)} />
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="lab-coming-soon">
          <h2 id="lab-coming-soon" className="text-xl font-semibold text-ink">
            {t('sections.comingSoon')}
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {comingSoon.map((tool) => (
              <li key={tool.id}>
                <LabToolCard tool={tool} href={null} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
