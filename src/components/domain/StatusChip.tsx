import {
  Archive,
  Ban,
  CalendarClock,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CirclePause,
  Clock,
  Lock,
  PencilLine,
  Send,
  Sparkles,
  Undo2,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Chip, type ChipTone } from '@/components/ui';
import type { ChallengePhase } from '@/types/challenge';
import type { CourseStatus } from '@/types/content';
import type { SubmissionStatus } from '@/types/project';

export type StatusChipStatus =
  | SubmissionStatus
  | CourseStatus
  | ChallengePhase
  | 'completed'
  | 'in_progress'
  // Account, school, certificate and licence states.
  | 'active'
  | 'disabled'
  | 'suspended'
  | 'issued'
  | 'revoked'
  | 'expired';

const LOOK: Record<StatusChipStatus, { tone: ChipTone; icon: LucideIcon }> = {
  submitted: { tone: 'accent', icon: Send },
  ai_reviewed: { tone: 'brand', icon: Sparkles },
  approved: { tone: 'success', icon: CircleCheck },
  returned: { tone: 'warning', icon: Undo2 },
  draft: { tone: 'neutral', icon: PencilLine },
  published: { tone: 'success', icon: CircleCheck },
  archived: { tone: 'neutral', icon: Archive },
  upcoming: { tone: 'accent', icon: CalendarClock },
  open: { tone: 'success', icon: CircleDot },
  closed: { tone: 'neutral', icon: Lock },
  completed: { tone: 'success', icon: CircleCheck },
  in_progress: { tone: 'brand', icon: CircleDashed },
  active: { tone: 'success', icon: CircleCheck },
  disabled: { tone: 'neutral', icon: Ban },
  suspended: { tone: 'warning', icon: CirclePause },
  issued: { tone: 'success', icon: CircleCheck },
  revoked: { tone: 'danger', icon: Ban },
  expired: { tone: 'warning', icon: Clock },
};

export interface StatusChipProps {
  status: StatusChipStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusChip({ status, size, className }: StatusChipProps) {
  const t = useTranslations('domain');
  const { tone, icon: Icon } = LOOK[status];
  return (
    <Chip tone={tone} size={size} icon={<Icon aria-hidden="true" />} className={className}>
      {t(`status.${status}`)}
    </Chip>
  );
}
