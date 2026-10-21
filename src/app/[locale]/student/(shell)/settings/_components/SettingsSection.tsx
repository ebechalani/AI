import type { ReactNode } from 'react';
import { Card, CardTitle } from '@/components/ui';

export interface SettingsSectionProps {
  /** The id of the `<h2>`, which also names the section. */
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}

/** One card of the Settings page. */
export function SettingsSection({ id, title, description, children }: SettingsSectionProps) {
  return (
    <Card as="section" aria-labelledby={id} className="gap-5 p-5 sm:p-6">
      <div>
        <CardTitle as="h2" id={id} className="text-lg">
          {title}
        </CardTitle>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
      {children}
    </Card>
  );
}
