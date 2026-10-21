'use client';

import { useState } from 'react';
import { Copy, Printer } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui';
import { credentialsText, type StudentCredential } from './class-model';
import { PrintableCredentials } from './PrintableCredentials';
import { DIALOG_TEXT } from './dialog';

export interface CredentialsDialogProps {
  open: boolean;
  /** The owner mounts it with a new `key` per batch, so `confirmed` starts false every time. */
  onClose: () => void;
  /** `credentials.title` (count) or `credentials.resetTitle` (name). */
  title: string;
  /** Printed on every slip. */
  className: string | null;
  credentials: StudentCredential[];
}

const SECRET_CELL = 'font-mono break-all select-all';
const LABEL = 'text-xs font-semibold text-ink-muted';

/**
 * Passwords shown once: a table to read, print or copy, and a checkbox the teacher must tick
 * before the dialog can be closed (Escape and the close button do nothing until then).
 */
export function CredentialsDialog({
  open,
  onClose,
  title,
  className,
  credentials,
}: CredentialsDialogProps) {
  const t = useTranslations('classes');
  const [confirmed, setConfirmed] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'copied' | 'failed' | null>(null);

  async function copyAll() {
    try {
      if (!navigator.clipboard) throw new Error('No clipboard');
      await navigator.clipboard.writeText(
        credentialsText(credentials, {
          name: t('credentials.name'),
          username: t('credentials.username'),
          password: t('credentials.password'),
        }),
      );
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="lg"
      className={DIALOG_TEXT}
      dismissible={confirmed}
      footer={
        <Button disabled={!confirmed} onClick={onClose}>
          {t('credentials.done')}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <Alert tone="warning" live="off" title={t('credentials.warningTitle')}>
          {t('credentials.warning')}
        </Alert>
        {/* Phones: one block per student, every line whole. Three padded columns do not fit
            the ~300 px dialog body, and a password cut off in a scroll area is easy to miss. */}
        <ul aria-label={t('credentials.caption')} className="flex flex-col gap-3 sm:hidden">
          {credentials.map((row, index) => (
            <li
              key={`${row.username}-${index}`}
              className="rounded-control border border-border bg-surface p-4"
            >
              <dl className="flex flex-col gap-2 text-sm">
                <div>
                  <dt className={LABEL}>{t('credentials.name')}</dt>
                  <dd className="font-semibold text-ink">{row.displayName}</dd>
                </div>
                <div>
                  <dt className={LABEL}>{t('credentials.username')}</dt>
                  <dd translate="no" className={`${SECRET_CELL} text-base text-ink`}>
                    {row.username}
                  </dd>
                </div>
                <div>
                  <dt className={LABEL}>{t('credentials.password')}</dt>
                  <dd translate="no" className={`${SECRET_CELL} text-base text-ink`}>
                    {row.password}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
        <Table caption={t('credentials.caption')} className="hidden sm:block">
          <TableHead>
            <TableRow>
              <TableHeaderCell>{t('credentials.name')}</TableHeaderCell>
              <TableHeaderCell>{t('credentials.username')}</TableHeaderCell>
              <TableHeaderCell>{t('credentials.password')}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {credentials.map((row, index) => (
              <TableRow key={`${row.username}-${index}`}>
                <TableHeaderCell scope="row" className="break-words whitespace-normal!">
                  {row.displayName}
                </TableHeaderCell>
                <TableCell translate="no" className={SECRET_CELL}>
                  {row.username}
                </TableCell>
                <TableCell translate="no" className={SECRET_CELL}>
                  {row.password}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer aria-hidden="true" />
            {t('credentials.print')}
          </Button>
          <Button variant="secondary" onClick={copyAll}>
            <Copy aria-hidden="true" />
            {t('credentials.copy')}
          </Button>
          <p role="status" className="text-sm font-medium text-ink-muted">
            {copyStatus === 'copied'
              ? t('credentials.copied')
              : copyStatus === 'failed'
                ? t('credentials.copyFailed')
                : null}
          </p>
        </div>
        <Checkbox
          label={t('credentials.confirm')}
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
        />
      </div>
      {open && <PrintableCredentials className={className} credentials={credentials} />}
    </Dialog>
  );
}
