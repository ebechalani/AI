'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Bot, PanelLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, IconButton } from '@/components/ui';
import { usePathname } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';
import { LessonSidePane } from './LessonSidePane';
import { TutorBridgeProvider, useTutorBridge } from './tutor-bridge';

// Tailwind's `xl`: from here up all three panes are on screen.
const WIDE_QUERY = '(min-width: 80rem)';

function subscribeToWidth(onChange: () => void) {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function useIsWide(): boolean {
  return useSyncExternalStore(
    subscribeToWidth,
    () => window.matchMedia(WIDE_QUERY).matches,
    () => true,
  );
}

type Overlay = 'outline' | 'tutor';

export interface LessonShellProps {
  /** The lesson's top bar: title, progress, stages, exit. */
  top: ReactNode;
  /** The course outline (LessonNavigation). */
  nav: ReactNode;
  /** The lesson content. */
  children: ReactNode;
  /** The tutor panel; null when the tutor is not available, which removes the pane and its button. */
  aside?: ReactNode;
  /** Previous / complete / next. */
  footer?: ReactNode;
}

function LessonFrame({ top, nav, children, aside, footer }: LessonShellProps) {
  const t = useTranslations('nav');
  const tDomain = useTranslations('domain');
  const { isOpen: tutorOpen, setOpen: setTutorOpen } = useTutorBridge();
  const isWide = useIsWide();
  const pathname = usePathname();
  const outlineId = useId();
  const tutorId = useId();
  const outlineCloseRef = useRef<HTMLButtonElement>(null);
  const tutorCloseRef = useRef<HTMLButtonElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);
  // The outline is open for the page it was opened on: following a lesson link closes it.
  const [outlineOpenOn, setOutlineOpenOn] = useState<string | null>(null);

  const hasTutor = aside !== undefined && aside !== null && aside !== false;
  const overlay: Overlay | null = isWide
    ? null
    : outlineOpenOn === pathname
      ? 'outline'
      : hasTutor && tutorOpen
        ? 'tutor'
        : null;
  const closeOverlay = () => (overlay === 'outline' ? setOutlineOpenOn(null) : setTutorOpen(false));

  // On a wide screen the tutor is always visible and "open" means nothing. Dropping the flag
  // there keeps the pane from sliding in later, when the window is made narrower.
  useEffect(() => {
    if (isWide && tutorOpen) setTutorOpen(false);
  }, [isWide, tutorOpen, setTutorOpen]);

  useEffect(() => {
    if (overlay === null) return;
    const close = () => (overlay === 'outline' ? setOutlineOpenOn(null) : setTutorOpen(false));

    // Focus moves into the pane and returns to where it was when the pane closes.
    returnFocusTo.current = document.activeElement as HTMLElement | null;
    (overlay === 'outline' ? outlineCloseRef : tutorCloseRef).current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);

    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      root.style.overflow = previousOverflow;
      returnFocusTo.current?.focus();
      returnFocusTo.current = null;
    };
  }, [overlay, setTutorOpen]);

  return (
    <div className="flex min-h-dvh bg-surface">
      <LessonSidePane
        side="start"
        id={outlineId}
        title={tDomain('lessonNav.label')}
        open={overlay === 'outline'}
        closeLabel={t('lesson.closeOutline')}
        closeRef={outlineCloseRef}
        onClose={() => setOutlineOpenOn(null)}
      >
        <div className="p-3">{nav}</div>
      </LessonSidePane>

      {/* While a pane is over the page, the page itself is out of reach. */}
      <div className="flex min-w-0 flex-1 flex-col" inert={overlay !== null}>
        <header className="sticky top-0 z-30 flex items-start gap-2 border-b border-border bg-surface/95 px-3 py-2 backdrop-blur-sm sm:px-6">
          <IconButton
            aria-label={t('lesson.openOutline')}
            aria-haspopup="dialog"
            aria-expanded={overlay === 'outline'}
            aria-controls={outlineId}
            onClick={() => setOutlineOpenOn(pathname)}
            className="-ms-1 xl:hidden"
          >
            <PanelLeft className="rtl:-scale-x-100" />
          </IconButton>
          <div className="min-w-0 flex-1 self-center">{top}</div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            'flex-1 px-4 py-6 outline-none sm:px-8 sm:py-8',
            hasTutor && 'max-xl:pb-24',
          )}
        >
          <div className="mx-auto w-full max-w-3xl">{children}</div>
        </main>

        <div className="sticky bottom-0 z-20">
          {hasTutor && (
            // Rides on top of the footer, whatever its height.
            <div className="absolute inset-e-4 bottom-full mb-4 rounded-control shadow-lg xl:hidden">
              <Button
                aria-haspopup="dialog"
                aria-expanded={overlay === 'tutor'}
                aria-controls={tutorId}
                onClick={() => setTutorOpen(true)}
              >
                <Bot aria-hidden="true" />
                {t('lesson.askTutor')}
              </Button>
            </div>
          )}
          {footer && (
            <footer className="border-t border-border bg-surface/95 px-4 py-3 backdrop-blur-sm sm:px-8">
              <div className="mx-auto w-full max-w-3xl">{footer}</div>
            </footer>
          )}
        </div>
      </div>

      {hasTutor && (
        <LessonSidePane
          side="end"
          id={tutorId}
          title={tDomain('chat.assistantName')}
          icon={<Bot aria-hidden="true" className="size-5 shrink-0 text-brand-600" />}
          landmark="complementary"
          fill
          open={overlay === 'tutor'}
          closeLabel={t('lesson.closeTutor')}
          closeRef={tutorCloseRef}
          onClose={() => setTutorOpen(false)}
        >
          {aside}
        </LessonSidePane>
      )}

      <div
        aria-hidden="true"
        onClick={closeOverlay}
        className={cn(
          'fixed inset-0 z-40 bg-ink/50 transition-opacity duration-200 xl:hidden',
          overlay === null && 'pointer-events-none opacity-0',
        )}
      />
    </div>
  );
}

/**
 * The frame of the lesson player. From `xl` up: outline 280px, content, tutor 360px, each
 * scrolling on its own. Below: the outline is a drawer opened from the top bar and the tutor a
 * slide-over opened by a floating button or by a lesson block through the tutor bridge.
 */
export function LessonShell(props: LessonShellProps): ReactElement {
  return (
    <TutorBridgeProvider>
      <LessonFrame {...props} />
    </TutorBridgeProvider>
  );
}
