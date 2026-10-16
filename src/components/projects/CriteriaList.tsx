import { useTranslations } from 'next-intl';
import { ProgressBar } from '@/components/ui';
import type { RubricKey } from '@/types/project';

export interface CriteriaRow {
  key: RubricKey;
  weight: number;
  score: number | null;
  comment?: string | null;
}

export interface CriteriaListProps {
  rows: CriteriaRow[];
  /** Without scores only the criteria, their weights and the comments are shown. */
  showScores: boolean;
}

/** The rubric's criteria: weight, score (as a bar and as text) and the comment under each. */
export function CriteriaList({ rows, showScores }: CriteriaListProps) {
  const t = useTranslations('projects');
  const tDomain = useTranslations('domain');
  return (
    <ul className="flex flex-col gap-4">
      {rows.map((row) => {
        const label = tDomain(`rubric.${row.key}`);
        return (
          <li key={row.key} className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <span className="text-sm font-semibold text-ink">{label}</span>
              <span className="text-xs text-ink-muted">
                {row.weight > 0
                  ? t('criteria.weight', { weight: row.weight })
                  : t('criteria.notWeighted')}
              </span>
            </div>
            {showScores && row.score !== null && (
              <div className="flex items-center gap-3">
                <ProgressBar size="sm" value={row.score} label={label} className="flex-1" />
                <span className="shrink-0 text-sm font-semibold text-ink tabular-nums">
                  {t('criteria.value', { score: row.score })}
                </span>
              </div>
            )}
            {row.comment && (
              <p className="text-sm break-words whitespace-pre-wrap text-ink-muted">
                {row.comment}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
