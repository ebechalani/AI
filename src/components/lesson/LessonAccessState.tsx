import { KeyRound, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState, LinkButton } from '@/components/ui';

export interface LessonAccessStateProps {
  reason: 'forbidden' | 'license_required';
  exitHref: string;
}

/**
 * The whole page when the course is hidden from the viewer or needs a licence they do not
 * have. It brings its own `<main>`: there is no LessonShell, and the player's layouts have none.
 */
export function LessonAccessState({ reason, exitHref }: LessonAccessStateProps) {
  const t = useTranslations('lesson');
  const tNav = useTranslations('nav');
  const key = reason === 'forbidden' ? 'forbidden' : 'licenseRequired';
  return (
    <main id="main-content" className="flex min-h-dvh flex-1 items-center justify-center p-6">
      <EmptyState
        variant="plain"
        icon={reason === 'forbidden' ? <Lock /> : <KeyRound />}
        title={t(`access.${key}.title`)}
        description={t(`access.${key}.description`)}
        action={<LinkButton href={exitHref}>{tNav('lesson.exit')}</LinkButton>}
      />
    </main>
  );
}
