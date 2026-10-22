import { useTranslations } from 'next-intl';
import { StatusChip, useDateFormat } from '@/components/domain';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui';
import type { Submission } from '@/types/project';

export interface EntriesTableProps {
  entries: Submission[];
  /** The challenge's title, for the caption. */
  title: string;
}

/** The entries of a challenge, read-only: supervised ones are reviewed by the class teacher, the others by the AI flow. */
export function EntriesTable({ entries, title }: EntriesTableProps) {
  const t = useTranslations('admin');
  const tDomain = useTranslations('domain');
  const formatDate = useDateFormat();

  return (
    <Table caption={t('challenges.entries.caption', { title })}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{t('challenges.entries.columns.student')}</TableHeaderCell>
          <TableHeaderCell>{t('challenges.entries.columns.entry')}</TableHeaderCell>
          <TableHeaderCell>{t('challenges.entries.columns.type')}</TableHeaderCell>
          <TableHeaderCell>{t('challenges.entries.columns.submitted')}</TableHeaderCell>
          <TableHeaderCell>{t('challenges.entries.columns.status')}</TableHeaderCell>
          <TableHeaderCell align="end">{t('challenges.entries.columns.score')}</TableHeaderCell>
          <TableHeaderCell>{t('challenges.entries.columns.reviewer')}</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableHeaderCell scope="row" wrap className="min-w-40 font-normal">
              <span className="font-medium break-words text-ink">{entry.studentName}</span>
            </TableHeaderCell>
            <TableCell className="min-w-48 whitespace-normal">
              <span className="block break-words">{entry.title}</span>
              <span className="block text-sm text-ink-muted">
                {t('challenges.entries.attempt', { number: entry.attemptNumber })}
              </span>
            </TableCell>
            <TableCell className="whitespace-nowrap">{tDomain(`submissionTypes.${entry.type}`)}</TableCell>
            <TableCell className="whitespace-nowrap">{formatDate(entry.submittedAt, 'dateTime')}</TableCell>
            <TableCell>
              <StatusChip status={entry.status} />
            </TableCell>
            <TableCell align="end" className="tabular-nums">
              {entry.finalScore === null ? (
                <span className="text-ink-muted">{t('shared.noValue')}</span>
              ) : (
                t('challenges.entries.score', { score: entry.finalScore })
              )}
            </TableCell>
            <TableCell className="whitespace-nowrap">
              {t(entry.classId !== null ? 'challenges.entries.teacher' : 'challenges.entries.ai')}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
