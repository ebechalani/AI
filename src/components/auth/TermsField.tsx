'use client';

import { useId, type ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/ui';
import { Link } from '@/lib/i18n/navigation';

export interface TermsFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Already translated. */
  error?: string;
}

function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  const t = useTranslations('common');
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-brand-700 underline underline-offset-4"
    >
      {children}
      <span className="sr-only"> ({t('a11y.opensInNewTab')})</span>
    </Link>
  );
}

/** "I accept the Terms of Use and the Privacy Policy", with both documents one click away. */
export function TermsField({ checked, onChange, error }: TermsFieldProps) {
  const t = useTranslations('auth');
  const errorId = `${useId()}-error`;
  return (
    <div className="min-w-0">
      <Checkbox
        name="acceptedTerms"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        required
        invalid={error !== undefined}
        aria-describedby={error ? errorId : undefined}
        label={t.rich('terms.accept', {
          terms: (chunks) => <LegalLink href="/terms">{chunks}</LegalLink>,
          privacy: (chunks) => <LegalLink href="/privacy">{chunks}</LegalLink>,
        })}
      />
      {error && (
        <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-danger">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
