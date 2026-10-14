// Shared look of Input, Textarea and Select. The boundary is darker than --color-border on
// purpose: a form control must stand out from the page at 3:1 (WCAG 1.4.11), a card need not.
export const CONTROL_CLASSES =
  'block w-full rounded-control border border-ink-muted/70 bg-surface px-3 text-base text-ink ' +
  'transition-colors placeholder:text-ink-muted hover:border-ink-muted ' +
  // Focus: the ring sits flush on the border, so the two read as one line.
  'focus-visible:border-brand-600 focus-visible:outline-offset-0 aria-invalid:border-danger ' +
  'disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-muted disabled:text-ink-muted';

export const CHOICE_LABEL_CLASSES = 'text-sm font-medium text-ink';
export const CHOICE_DESCRIPTION_CLASSES = 'text-sm text-ink-muted';

/** Joins the ids a control is described by; anything that is not a non-empty string is skipped. */
export function describedBy(...ids: unknown[]): string | undefined {
  return ids.filter((id) => typeof id === 'string' && id !== '').join(' ') || undefined;
}
