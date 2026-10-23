'use client';

import {
  createContext,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@/components/classes/ConfirmDialog';

// The unsaved-changes guard of the editor pages (5.3). Forms register whether they are dirty;
// while any is, a reload, a closed tab or a typed URL asks the browser's own question, and a
// click on a link of the page (sidebar, breadcrumbs, Preview…) opens the leave dialog. Not
// guarded (Q7): the browser's Back and Forward buttons and the top bar's language menu.

export interface UnsavedChangesApi {
  setDirty(id: string, dirty: boolean): void;
  /** Called whenever the page goes from clean to dirty or back. */
  subscribeDirty(listener: (anyDirty: boolean) => void): () => void;
  isAnyDirty(): boolean;
}

const UnsavedChangesContext = createContext<UnsavedChangesApi | null>(null);

export function useUnsavedChanges(): UnsavedChangesApi | null {
  return use(UnsavedChangesContext);
}

/** Adds or removes `id` in the page's dirty set; removed on unmount. */
export function useRegisterDirty(id: string, dirty: boolean): void {
  const api = use(UnsavedChangesContext);
  useEffect(() => {
    api?.setDirty(id, dirty);
  }, [api, id, dirty]);
  useEffect(() => () => api?.setDirty(id, false), [api, id]);
}

// A plain primary click on a same-origin link to another page, outside [data-unsaved-ignore].
function guardedHref(event: MouseEvent): string | null {
  if (event.defaultPrevented || event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const target = event.target;
  if (!(target instanceof Element)) return null;
  const anchor = target.closest('a[href]');
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  if (anchor.hasAttribute('download') || anchor.closest('[data-unsaved-ignore]')) return null;
  const frame = anchor.getAttribute('target');
  if (frame !== null && frame !== '' && frame !== '_self') return null;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (url.pathname + url.search === window.location.pathname + window.location.search) return null;
  return url.href;
}

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const t = useTranslations('courseEditor');
  const dirtyRef = useRef(new Set<string>());
  const listenersRef = useRef(new Set<(anyDirty: boolean) => void>());
  const [leaveHref, setLeaveHref] = useState<string | null>(null);

  const api = useMemo<UnsavedChangesApi>(
    () => ({
      setDirty(id, dirty) {
        const set = dirtyRef.current;
        const before = set.size > 0;
        if (dirty) set.add(id);
        else set.delete(id);
        const after = set.size > 0;
        if (before !== after) for (const listener of listenersRef.current) listener(after);
      },
      subscribeDirty(listener) {
        listenersRef.current.add(listener);
        return () => {
          listenersRef.current.delete(listener);
        };
      },
      isAnyDirty() {
        return dirtyRef.current.size > 0;
      },
    }),
    [],
  );

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (dirtyRef.current.size === 0) return;
      event.preventDefault();
      // Older browsers still need the legacy property to show their prompt.
      event.returnValue = '';
    }
    // Capture phase on the document: before the router's own handler on the link.
    function onClick(event: MouseEvent) {
      if (dirtyRef.current.size === 0) return;
      const href = guardedHref(event);
      if (href === null) return;
      event.preventDefault();
      event.stopPropagation();
      setLeaveHref(href);
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, []);

  function leave() {
    if (leaveHref === null) return;
    dirtyRef.current.clear();
    // A full load: the href already has its locale, which the i18n router would add again.
    window.location.assign(leaveHref);
  }

  return (
    <UnsavedChangesContext value={api}>
      {children}
      <ConfirmDialog
        open={leaveHref !== null}
        onClose={() => setLeaveHref(null)}
        title={t('unsaved.title')}
        description={t('unsaved.description')}
        confirmLabel={t('unsaved.leave')}
        confirmVariant="danger"
        pending={false}
        error={null}
        onConfirm={leave}
      />
    </UnsavedChangesContext>
  );
}
