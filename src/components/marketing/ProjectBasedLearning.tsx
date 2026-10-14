import { ClipboardCheck, FlaskConical, MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LESSON_STAGES } from '@/types/content';
import { Section } from './Section';

// The nine steps of a lesson (ARCHITECTURE.md 7.6), labelled from the shared vocabulary.
const FLOW = [...LESSON_STAGES, 'earn'] as const;

const POINTS = [
  { key: 'tutor', Icon: MessageCircle },
  { key: 'review', Icon: ClipboardCheck },
  { key: 'lab', Icon: FlaskConical },
] as const;

/** "Project-Based Learning": the lesson flow beside what makes the projects real. */
export function ProjectBasedLearning() {
  const t = useTranslations('home');
  const tDomain = useTranslations('domain');
  return (
    <Section
      id="project-based"
      layout="split"
      eyebrow={t('projectBased.eyebrow')}
      title={t('projectBased.title')}
      description={t('projectBased.description')}
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="rounded-card border border-brand-100 bg-linear-to-br from-brand-50 via-surface to-accent-50 p-6 shadow-card">
          <h3 className="text-sm font-semibold tracking-wider text-brand-700 uppercase">
            {t('projectBased.flowTitle')}
          </h3>
          <ol className="mt-4 flex flex-col gap-2.5">
            {FLOW.map((stage, index) => (
              <li key={stage} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold text-brand-700 shadow-sm ring-1 ring-brand-200 ring-inset tabular-nums"
                >
                  {index + 1}
                </span>
                <span className="text-sm font-semibold text-ink">{tDomain(`stages.${stage}`)}</span>
              </li>
            ))}
          </ol>
        </div>
        <ul className="flex flex-col gap-4">
          {POINTS.map(({ key, Icon }) => (
            <li
              key={key}
              className="flex gap-4 rounded-card border border-border bg-surface p-5 shadow-card"
            >
              <span
                aria-hidden="true"
                className="flex size-11 shrink-0 items-center justify-center rounded-control bg-accent-50 text-accent-800"
              >
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base leading-snug font-semibold text-ink">
                  {t(`projectBased.points.${key}.title`)}
                </h3>
                <p className="mt-1.5 text-sm text-ink-muted">
                  {t(`projectBased.points.${key}.description`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
