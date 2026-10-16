'use client';

import { useTranslations } from 'next-intl';
import { AIChatPanel } from '@/components/domain';
import { useTutorBridge } from '@/components/layout';
import { TUTOR_MODES, type TutorMode } from '@/types/ai';
import { streamingTextOf, type TutorBlock } from './tutor-model';
import { TutorToolbar } from './TutorToolbar';
import { useTutorChat } from './use-tutor-chat';

export interface TutorPanelProps {
  courseId?: string;
  lessonId?: string;
  defaultMode?: TutorMode;
  /** `panel` inside LessonShell's aside, `page` on /student/tutor. */
  variant: 'panel' | 'page';
}

const MODES = [...TUTOR_MODES];

/**
 * The tutor (ARCHITECTURE.md 7.4, 7.7): the conversation of this lesson or course. It takes a
 * starter prompt only through useTutorBridge(), and fills its parent's height.
 */
export function TutorPanel({
  courseId,
  lessonId,
  defaultMode = 'explain',
  variant,
}: TutorPanelProps) {
  const t = useTranslations('tutor');
  const tErrors = useTranslations('errors');
  const { request } = useTutorBridge();
  const chat = useTutorChat({
    courseId: courseId ?? null,
    lessonId: lessonId ?? null,
    defaultMode,
    request,
  });
  const { state } = chat;

  const disabledReason = (block: TutorBlock | null): string | null => {
    switch (block?.kind) {
      case 'limit':
        return t('limitReached');
      case 'cooldown':
        return t('slowDown', { seconds: block.seconds });
      case 'forbidden':
        return t('notAvailable');
      case 'unauthenticated':
        return tErrors('unauthenticated');
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TutorToolbar
        variant={variant}
        canReset={state.messages.length > 0 && state.reply === null}
        onReset={chat.reset}
        showPrivacyTip={variant === 'page' || state.messages.length === 0}
        announcement={chat.announcement}
      />
      <AIChatPanel
        className="min-h-0 flex-1"
        messages={state.messages}
        mode={state.mode}
        modes={MODES}
        streamingText={streamingTextOf(state)}
        pending={state.reply !== null}
        disabledReason={disabledReason(state.block)}
        remainingToday={state.remainingToday}
        draft={chat.draft}
        onModeChange={chat.setMode}
        onSend={chat.send}
      />
    </div>
  );
}
