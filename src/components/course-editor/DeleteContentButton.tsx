'use client';

import { useTranslations } from 'next-intl';
import { deleteProjectAction, deleteQuizAction } from '@/actions/course-editor';
import { ConfirmDialog } from '@/components/classes/ConfirmDialog';
import { Button, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import { useConfirmedAction } from './use-confirmed-action';
import { useEditorAction } from './use-editor-action';

export interface DeleteContentButtonProps {
  kind: 'quiz' | 'project';
  courseId: string;
  id: string;
  title: string;
  /** A lesson uses it (the server refuses the delete; the message says why). */
  linked: boolean;
  /** Where to go after the delete (the editor pages: back to the content list). */
  navigateTo?: string;
}

/** Deletes an unused quiz or project after a confirmation (6.2.6). */
export function DeleteContentButton({
  kind,
  courseId,
  id,
  title,
  linked,
  navigateTo,
}: DeleteContentButtonProps) {
  const t = useTranslations('courseEditor');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { toast } = useToast();
  const { refresh } = useEditorAction();
  const remove = useConfirmedAction();

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="text-danger hover:bg-danger/10"
        aria-label={t('content.deleteLabel', { title })}
        onClick={remove.show}
      >
        {tCommon('actions.delete')}
      </Button>
      <ConfirmDialog
        open={remove.open}
        onClose={remove.close}
        title={
          kind === 'quiz'
            ? t('content.deleteQuizTitle', { title })
            : t('content.deleteProjectTitle', { title })
        }
        description={t('content.deleteDescription')}
        confirmLabel={tCommon('actions.delete')}
        confirmVariant="danger"
        pending={remove.pending}
        error={remove.error}
        onConfirm={() =>
          remove.confirm(
            () =>
              kind === 'quiz'
                ? deleteQuizAction({ courseId, quizId: id })
                : deleteProjectAction({ courseId, projectId: id }),
            {
              context: { action: kind === 'quiz' ? 'deleteQuiz' : 'deleteProject', linked },
              onSuccess: () => {
                toast({ tone: 'success', title: t('content.deleted') });
                if (navigateTo !== undefined) router.push(navigateTo);
                refresh();
              },
            },
          )
        }
      />
    </>
  );
}
