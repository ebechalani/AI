import { useTranslations } from 'next-intl';
import { Alert, LinkButton } from '@/components/ui';

export interface LessonPreviewNoticeProps {
  /** The viewer could enrol from the course page (an unenrolled student in a student course). */
  canEnroll: boolean;
  /** The route's exit: the course page, which has the Enroll button. */
  courseHref: string;
}

/** Says that the preview saves nothing, and, when the viewer could enrol, where to do it. */
export function LessonPreviewNotice({ canEnroll, courseHref }: LessonPreviewNoticeProps) {
  const t = useTranslations('lesson');
  return (
    <Alert
      tone="info"
      live="off"
      title={t('preview.title')}
      action={
        canEnroll ? (
          <LinkButton href={courseHref} size="sm">
            {t('preview.enrollAction')}
          </LinkButton>
        ) : undefined
      }
    >
      <p>{t('preview.description')}</p>
      {canEnroll && <p className="mt-1">{t('preview.enrollHint')}</p>}
    </Alert>
  );
}
