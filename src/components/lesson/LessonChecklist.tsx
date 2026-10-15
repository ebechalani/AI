import { Circle, CircleCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/ui';
import type { ChecklistItem } from './lesson-model';

export interface LessonChecklistProps {
  /** Empty in the read-only preview. */
  items: ChecklistItem[];
  completed: boolean;
  readOnly: boolean;
  xpReward: number;
}

function ItemLabel({ item }: { item: ChecklistItem }) {
  const t = useTranslations('lesson');
  const label =
    item.kind === 'reflection'
      ? t('checklist.reflection', { title: item.label, min: item.minLength ?? 0 })
      : t(`checklist.${item.kind}`, { title: item.label });
  if (item.anchor === null) return <span>{label}</span>;
  return (
    <a
      href={`#${item.anchor}`}
      className="font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800"
    >
      {label}
    </a>
  );
}

/**
 * The EARN section's body: what "Complete lesson" still waits for (9.4), or that the lesson is
 * done. The preview only says what a learner would earn.
 */
export function LessonChecklist({ items, completed, readOnly, xpReward }: LessonChecklistProps) {
  const t = useTranslations('lesson');

  if (readOnly) return <p className="text-ink-muted">{t('earn.previewIntro', { xp: xpReward })}</p>;
  if (completed) {
    return (
      <Alert tone="success" live="off">
        <span className="font-semibold">{t('earn.done')}</span>
      </Alert>
    );
  }

  const missingCount = items.filter((item) => !item.done).length;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-ink">{t('earn.intro', { xp: xpReward })}</p>
      {items.length > 0 && (
        <div className="flex flex-col gap-3 rounded-card border border-border bg-surface-muted/60 p-4 sm:p-5">
          <h3 className="font-semibold text-ink">{t('checklist.title')}</h3>
          <ul className="flex flex-col gap-2.5">
            {items.map((item) => (
              <li key={`${item.kind}/${item.id}`} className="flex items-start gap-2.5">
                {item.done ? (
                  <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success" />
                ) : (
                  <Circle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ink-muted" />
                )}
                <span className="min-w-0 flex-1 break-words text-ink">
                  <ItemLabel item={item} />
                  <span className="sr-only">
                    {' '}
                    {item.done ? t('checklist.done') : t('checklist.todo')}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {missingCount === 0 && (
        <Alert tone="success" live="off">
          {t('checklist.ready')}
        </Alert>
      )}
    </div>
  );
}
