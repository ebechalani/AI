import { useTranslations } from 'next-intl';
import { Alert } from '@/components/ui';
import type { CourseStatus } from '@/types/content';
import type { EditorMode } from './paths';

export interface EditorNoticesProps {
  status: CourseStatus;
  /** Learners are enrolled: structure can no longer be deleted. */
  locked: boolean;
  mode: EditorMode;
  /** A platform admin editing a course a teacher made. */
  teacherMade: boolean;
  /** The quiz page adds that changed answers do not re-mark past attempts. */
  quiz?: boolean;
}

/** What an author must know before editing: live changes, the delete lock, a teacher's course. */
export function EditorNotices({ status, locked, mode, teacherMade, quiz }: EditorNoticesProps) {
  const t = useTranslations('courseEditor');
  const live = status === 'published';
  if (!live && !locked && !(mode === 'admin' && teacherMade)) return null;
  return (
    <div className="flex flex-col gap-3">
      {live && (
        <Alert tone="info" live="off">
          <p>{t('notices.live')}</p>
          {quiz && <p className="mt-1">{t('notices.quizLive')}</p>}
        </Alert>
      )}
      {locked && (
        <Alert tone="warning" live="off">
          {t('notices.locked')}
        </Alert>
      )}
      {mode === 'admin' && teacherMade && (
        <Alert tone="info" live="off">
          {t('notices.teacherMade')}
        </Alert>
      )}
    </div>
  );
}
