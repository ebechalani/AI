import { BookOpen, FlaskConical, Hammer, MessageSquare, RefreshCw, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Section } from './Section';

// The product principle (brief section 29), in order.
const STEPS = [
  { key: 'learn', Icon: BookOpen },
  { key: 'try', Icon: FlaskConical },
  { key: 'build', Icon: Hammer },
  { key: 'feedback', Icon: MessageSquare },
  { key: 'improve', Icon: RefreshCw },
  { key: 'show', Icon: Share2 },
] as const;

/** "How It Works": learn, try, build, get feedback, improve, show your project. */
export function HowItWorks() {
  const t = useTranslations('home');
  return (
    <Section
      id="how-it-works"
      eyebrow={t('howItWorks.eyebrow')}
      title={t('howItWorks.title')}
      description={t('howItWorks.description')}
    >
      <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map(({ key, Icon }, index) => (
          <li
            key={key}
            className="relative flex gap-4 rounded-card border border-border bg-surface p-5 shadow-card"
          >
            <div className="flex flex-col items-center gap-2">
              <span
                aria-hidden="true"
                className="flex size-11 shrink-0 items-center justify-center rounded-control bg-linear-to-br from-brand-600 to-accent-600 text-white"
              >
                <Icon className="size-5" />
              </span>
              <span className="text-xs font-bold text-ink-muted tabular-nums">
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="text-lg leading-snug font-semibold text-ink">
                {t(`howItWorks.steps.${key}.title`)}
              </h3>
              <p className="mt-1.5 text-sm text-ink-muted">
                {t(`howItWorks.steps.${key}.description`)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
