import { ArrowRight, Bot } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardTitle, LinkButton } from '@/components/ui';

/**
 * The way to Robo AI from Home. It stays even when the school switched AI off, like the nav
 * item: the tutor page explains that case (6.4), and Home reads no school document (3.7).
 */
export function TutorShortcut() {
  const t = useTranslations('student');
  return (
    <Card tone="brand" className="gap-3 p-5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-control bg-brand-600 text-white"
        >
          <Bot className="size-5" />
        </span>
        <CardTitle as="h2" className="min-w-0">
          {t('tutor.title')}
        </CardTitle>
      </div>
      <p className="text-sm text-ink-muted">{t('tutor.description')}</p>
      <LinkButton
        href="/student/tutor"
        variant="secondary"
        size="sm"
        className="mt-auto self-start"
      >
        {t('tutor.action')}
        <ArrowRight aria-hidden="true" className="rtl:rotate-180" />
      </LinkButton>
    </Card>
  );
}
