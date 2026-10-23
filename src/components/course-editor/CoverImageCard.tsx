'use client';

import { useTranslations } from 'next-intl';
import { updateCourseAction } from '@/actions/course-editor';
import { ConfirmDialog } from '@/components/classes/ConfirmDialog';
import { MediaImage } from '@/components/domain';
import { FileUpload } from '@/components/projects/FileUpload';
import { Button, Card, CardTitle, useToast } from '@/components/ui';
import type { Course } from '@/types/content';
import { COVER_ANCHOR } from './paths';
import { useConfirmedAction } from './use-confirmed-action';
import { useEditorAction } from './use-editor-action';

export interface CoverImageCardProps {
  course: Course;
  /** Admin mode on an official course: the upload goes to the official media prefix (1.2). */
  official: boolean;
}

/** The course's cover image: current image, upload, removal (6.2.5). Not part of the form. */
export function CoverImageCard({ course, official }: CoverImageCardProps) {
  const t = useTranslations('courseEditor');
  const { toast } = useToast();
  const { run, refresh } = useEditorAction();
  const remove = useConfirmedAction();

  async function save(coverImageFileId: string) {
    const result = await run(
      () => updateCourseAction({ courseId: course.id, patch: { coverImageFileId } }),
      { report: 'toast', notFound: 'mediaGone' },
    );
    if (!result.ok) return;
    toast({ tone: 'success', title: t('cover.saved') });
    refresh();
  }

  return (
    <Card id={COVER_ANCHOR} tabIndex={-1} className="gap-4 p-5 outline-none sm:p-6">
      <CardTitle as="h3" className="text-lg font-bold">
        {t('cover.title')}
      </CardTitle>
      {course.coverImage ? (
        <MediaImage
          media={course.coverImage}
          alt={t('cover.alt')}
          frame="16:9"
          sizes="(min-width: 1024px) 400px, 100vw"
          className="max-w-md rounded-md"
        />
      ) : (
        <p className="text-sm text-ink-muted">{t('cover.none')}</p>
      )}
      <p className="text-sm text-ink-muted">{t('cover.hint')}</p>
      <FileUpload
        purpose="course_media"
        kinds={['image']}
        courseId={course.id}
        official={official}
        onUploaded={({ file }) => void save(file.fileId)}
      />
      {course.coverImage && (
        <div>
          <Button variant="ghost" onClick={remove.show}>
            {t('cover.remove')}
          </Button>
          <ConfirmDialog
            open={remove.open}
            onClose={remove.close}
            title={t('cover.removeTitle')}
            description={t('cover.removeDescription')}
            confirmLabel={t('cover.remove')}
            confirmVariant="danger"
            pending={remove.pending}
            error={remove.error}
            onConfirm={() =>
              remove.confirm(
                () => updateCourseAction({ courseId: course.id, patch: { coverImageFileId: null } }),
                {
                  onSuccess: () => {
                    toast({ tone: 'success', title: t('cover.removed') });
                    refresh();
                  },
                },
              )
            }
          />
        </div>
      )}
    </Card>
  );
}
