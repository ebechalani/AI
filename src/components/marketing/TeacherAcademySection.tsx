import { ArrowRight, Check, GraduationCap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PathwayCard } from '@/components/domain';
import { LinkButton } from '@/components/ui';
import type { Pathway } from '@/types/content';
import { Section } from './Section';

export interface TeacherAcademySectionProps {
  /** The published Teacher Academy pathway, when there is one. */
  pathway: Pathway | null;
}

const POINTS = ['foundations', 'lessons', 'assessment', 'responsible'] as const;

/** "Teacher Academy": professional development, with the real pathway card when it exists. */
export function TeacherAcademySection({ pathway }: TeacherAcademySectionProps) {
  const t = useTranslations('home');
  return (
    <Section
      id="teacher-academy"
      tone="muted"
      layout="split"
      eyebrow={t('teacherAcademy.eyebrow')}
      title={t('teacherAcademy.title')}
      description={t('teacherAcademy.description')}
      actions={
        <>
          <LinkButton href={pathway ? `/pathways/${pathway.id}` : '/pathways'} size="lg">
            {t('teacherAcademy.cta')}
            <ArrowRight aria-hidden="true" className="rtl:-scale-x-100" />
          </LinkButton>
          <LinkButton href="/signup?role=teacher" variant="secondary" size="lg">
            {t('teacherAcademy.signup')}
          </LinkButton>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-2 md:items-start">
        <ul className="flex flex-col gap-3 rounded-card border border-border bg-surface p-6 shadow-card">
          {POINTS.map((point) => (
            <li key={point} className="flex items-start gap-3 text-sm font-medium text-ink">
              <span
                aria-hidden="true"
                className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success"
              >
                <Check className="size-3.5" strokeWidth={3} />
              </span>
              {t(`teacherAcademy.points.${point}`)}
            </li>
          ))}
        </ul>
        {pathway ? (
          <PathwayCard pathway={pathway} href={`/pathways/${pathway.id}`} />
        ) : (
          <div
            aria-hidden="true"
            className="flex min-h-48 items-center justify-center rounded-card border border-dashed border-ink-muted/40 bg-surface/60 text-brand-600"
          >
            <GraduationCap className="size-12" strokeWidth={1.5} />
          </div>
        )}
      </div>
    </Section>
  );
}
