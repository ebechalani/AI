'use client';

import { Bot, FlaskConical } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTutorBridge } from '@/components/layout';
import { Button, LinkButton } from '@/components/ui';
import { usePathname } from '@/lib/i18n/navigation';
import type { TutorMode } from '@/types/ai';
import { activityLabHref } from './tutor-model';

export interface AiActivityLauncherProps {
  mode: TutorMode;
  starterPrompt: string | null;
  labToolId: string | null;
}

/** The buttons of an AI activity: open the tutor with the activity's prompt, or the AI Lab. */
export function AiActivityLauncher({ mode, starterPrompt, labToolId }: AiActivityLauncherProps) {
  const t = useTranslations('tutor');
  const { open } = useTutorBridge();
  const labHref = activityLabHref(labToolId, usePathname());

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => open({ mode, starterPrompt })}>
          <Bot aria-hidden="true" />
          {t('activity.open')}
        </Button>
        {labHref !== null && (
          <LinkButton href={labHref} variant="secondary">
            <FlaskConical aria-hidden="true" />
            {t('activity.openLab')}
          </LinkButton>
        )}
      </div>
      {starterPrompt && <p className="text-sm text-ink-muted">{t('activity.hint')}</p>}
    </div>
  );
}
