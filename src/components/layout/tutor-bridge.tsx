'use client';

import {
  createContext,
  use,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { TutorMode } from '@/types/ai';

// The channel between lesson blocks and the tutor panel: a block asks for the tutor, the panel
// picks the request up, and LessonShell shows the panel where it is not always visible.

export interface TutorOpenRequest {
  mode: TutorMode;
  starterPrompt: string | null;
  /** Grows with every open(), so the same mode and prompt asked for twice are two requests. */
  nonce: number;
}

export interface TutorBridge {
  /** Asks for the tutor in `mode`, optionally with a prompt to start from, and shows the panel. */
  open(opts: { mode: TutorMode; starterPrompt?: string | null }): void;
  /** The latest request; the tutor panel applies it whenever `nonce` changes. */
  request: TutorOpenRequest | null;
  isOpen: boolean;
  setOpen(open: boolean): void;
}

const TutorBridgeContext = createContext<TutorBridge | null>(null);

// Outside a provider (the full-page tutor) there is nothing to open and nobody to ask.
const NOOP_BRIDGE: TutorBridge = {
  open() {},
  request: null,
  isOpen: false,
  setOpen() {},
};

export function TutorBridgeProvider({ children }: { children: ReactNode }): ReactElement {
  const [request, setRequest] = useState<TutorOpenRequest | null>(null);
  const [isOpen, setOpen] = useState(false);
  const nonce = useRef(0);

  const open = useCallback<TutorBridge['open']>(({ mode, starterPrompt }) => {
    nonce.current += 1;
    setRequest({ mode, starterPrompt: starterPrompt ?? null, nonce: nonce.current });
    setOpen(true);
  }, []);

  const bridge = useMemo<TutorBridge>(
    () => ({ open, request, isOpen, setOpen }),
    [open, request, isOpen],
  );

  return <TutorBridgeContext value={bridge}>{children}</TutorBridgeContext>;
}

export function useTutorBridge(): TutorBridge {
  return use(TutorBridgeContext) ?? NOOP_BRIDGE;
}
