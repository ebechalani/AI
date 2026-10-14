'use client';

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { IconButton } from './IconButton';
import { TONE_ICON, type StatusTone } from './tones';

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: StatusTone;
  /** Time on screen; 0 keeps the toast until it is dismissed. Defaults to 5 s (8 s for `danger`). */
  durationMs?: number;
}

export interface ToastApi {
  /** Shows a toast and returns its id. */
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

interface ToastEntry extends Required<ToastOptions> {
  id: string;
}

const MAX_VISIBLE = 4;
const ICONS = { info: Info, success: CircleCheck, warning: TriangleAlert, danger: CircleAlert };

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = use(ToastContext);
  if (!api) throw new Error('useToast() needs a <ToastProvider> above it.');
  return api;
}

function ToastCard({ entry, onDismiss }: { entry: ToastEntry; onDismiss: (id: string) => void }) {
  const t = useTranslations('common');
  const [paused, setPaused] = useState(false);
  const { id, tone, durationMs } = entry;
  const Icon = ICONS[tone];

  useEffect(() => {
    if (paused || durationMs <= 0) return;
    const timer = setTimeout(() => onDismiss(id), durationMs);
    return () => clearTimeout(timer);
  }, [paused, durationMs, id, onDismiss]);

  return (
    <div
      role={tone === 'danger' ? 'alert' : undefined}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border border-border bg-surface p-4 shadow-xl',
        'transition-[opacity,translate] duration-200 starting:translate-y-2 starting:opacity-0',
      )}
    >
      <Icon aria-hidden="true" className={cn('mt-0.5 size-5 shrink-0', TONE_ICON[tone])} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{entry.title}</p>
        {entry.description && <p className="mt-0.5 text-sm text-ink-muted">{entry.description}</p>}
      </div>
      <IconButton
        aria-label={t('a11y.dismiss')}
        size="sm"
        onClick={() => onDismiss(id)}
        className="-me-1.5 -mt-1.5"
      >
        <X />
      </IconButton>
    </div>
  );
}

/**
 * Renders the toast region after its children. A modal `Dialog` covers the region, so report
 * a failure inside an open dialog with an inline `Alert` instead.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const t = useTranslations('common');
  const [entries, setEntries] = useState<ToastEntry[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const toast = useCallback((options: ToastOptions) => {
    counter.current += 1;
    const id = `toast-${counter.current}`;
    const tone = options.tone ?? 'info';
    const entry: ToastEntry = {
      id,
      tone,
      title: options.title,
      description: options.description ?? '',
      durationMs: options.durationMs ?? (tone === 'danger' ? 8000 : 5000),
    };
    setEntries((current) => [...current, entry].slice(-MAX_VISIBLE));
    return id;
  }, []);

  const api = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext value={api}>
      {children}
      {/* Top of the screen on phones (the bottom edge holds the student tab bar), bottom
          corner from sm up. Always mounted: a live region must exist before its content. */}
      <div
        role="region"
        aria-label={t('a11y.notifications')}
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-0 z-100 flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:inset-e-0 sm:top-auto sm:bottom-0 sm:w-[26rem] sm:items-end"
      >
        {entries.map((entry) => (
          <ToastCard key={entry.id} entry={entry} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext>
  );
}
