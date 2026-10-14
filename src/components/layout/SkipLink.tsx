import { useTranslations } from 'next-intl';

/** The first focusable element of a shell: jumps over the navigation to `#main-content`. */
export function SkipLink() {
  const t = useTranslations('common');
  return (
    <a
      href="#main-content"
      // Parked above the viewport until it has focus.
      className="fixed inset-s-3 top-3 z-[60] -translate-y-20 rounded-control bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg focus:translate-y-0"
    >
      {t('a11y.skipToContent')}
    </a>
  );
}
