'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import type { AgeBand } from '@/types/common';
import { AddStudentsForm } from './AddStudentsForm';
import type { StudentCredential } from './class-model';
import { CredentialsDialog } from './CredentialsDialog';
import { useFocusAfterClose } from './use-focus-after-close';

export interface AddStudentsButtonProps {
  classId: string;
  className: string;
  allowedBands: AgeBand[];
  /** `creation.defaultBand`, never null where the button is offered. */
  defaultBand: AgeBand;
  capacityLeft: number;
}

/**
 * "Add students", then the shown-once credentials. The page is refreshed only when a dialog
 * closes (the credentials, or the form after a failure that may have changed the class): a
 * refresh while one is open could replace this button (a class that became full) and unmount
 * the dialog with the only copy of the passwords or of the message about them.
 */
export function AddStudentsButton({
  classId,
  className,
  allowedBands,
  defaultBand,
  capacityLeft,
}: AddStudentsButtonProps) {
  const t = useTranslations('classes');
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [formSession, setFormSession] = useState(0);
  const [credentials, setCredentials] = useState<StudentCredential[] | null>(null);
  const [batch, setBatch] = useState(0);
  const focusLater = useFocusAfterClose(credentials !== null);
  const focusAfterForm = useFocusAfterClose(formOpen);

  return (
    <>
      <Button
        onClick={() => {
          setFormSession((value) => value + 1);
          setFormOpen(true);
        }}
      >
        <UserPlus aria-hidden="true" />
        {t('addStudents.action')}
      </Button>
      {/* Before the credentials dialog: its close returns focus to the trigger first. */}
      <AddStudentsForm
        key={`form-${formSession}`}
        open={formOpen}
        onClose={(stale) => {
          if (stale) {
            // The refresh may replace this button (a class now full): the roster's heading
            // keeps the focus, as after the credentials.
            focusAfterForm('roster-title');
            router.refresh();
          }
          setFormOpen(false);
        }}
        classId={classId}
        className={className}
        allowedBands={allowedBands}
        defaultBand={defaultBand}
        capacityLeft={capacityLeft}
        onCreated={(created) => {
          setFormOpen(false);
          setCredentials(created);
          setBatch((value) => value + 1);
        }}
      />
      <CredentialsDialog
        key={`credentials-${batch}`}
        open={credentials !== null}
        onClose={() => {
          // The new students appear under the roster heading.
          focusLater('roster-title');
          setCredentials(null);
          router.refresh();
        }}
        title={t('credentials.title', { count: credentials?.length ?? 0 })}
        className={className}
        credentials={credentials ?? []}
      />
    </>
  );
}
