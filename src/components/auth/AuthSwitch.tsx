import { Link } from '@/lib/i18n/navigation';

export interface AuthSwitchProps {
  /** "Already have an account?" */
  prompt: string;
  /** Locale-less path. */
  href: string;
  /** "Log in" */
  label: string;
}

/** The one-line pointer at the foot of an auth card to the neighbouring page. */
export function AuthSwitch({ prompt, href, label }: AuthSwitchProps) {
  return (
    <p className="text-center text-sm text-ink-muted">
      {prompt}{' '}
      <Link
        href={href}
        className="inline-flex min-h-11 items-center rounded-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
      >
        {label}
      </Link>
    </p>
  );
}
