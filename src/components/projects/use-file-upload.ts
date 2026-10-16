import { useEffect, useRef, useState, type RefObject } from 'react';
import { registerUploadAction } from '@/actions/files';
import { uploadFile } from '@/lib/firebase/upload-client';
import type { ActionError } from '@/types/actions';
import type { FileKind, FileRef, MediaRef } from '@/types/common';
import { focusInView, focusWasLost } from './focus';
import {
  precheck,
  registerInput,
  toActionError,
  uploadArgs,
  uploadErrorView,
  type UploadErrorView,
  type UploadTarget,
} from './upload-model';

// FileUpload's state machine (SPEC-D 5.2): a quick check, the browser upload with its progress,
// then registerUploadAction. One file at a time; there is no cancel (the client API has none).

export type UploadState =
  | { phase: 'idle' }
  | { phase: 'uploading'; name: string; percent: number }
  | { phase: 'registering'; name: string }
  | { phase: 'error'; view: UploadErrorView; name: string | null };

export interface UseFileUploadArgs {
  target: UploadTarget;
  kinds: readonly FileKind[];
  onUploaded: (result: { file: FileRef; media: MediaRef | null }) => void;
  /** The live region's text after a success, already translated. */
  doneMessage: (name: string) => string;
  /** The control: focus returns to its button when the upload took it away. */
  containerRef: RefObject<HTMLElement | null>;
  buttonRef: RefObject<HTMLButtonElement | null>;
}

export function useFileUpload({
  target,
  kinds,
  onUploaded,
  doneMessage,
  containerRef,
  buttonRef,
}: UseFileUploadArgs) {
  const [state, setState] = useState<UploadState>({ phase: 'idle' });
  const [announcement, setAnnouncement] = useState('');
  const [succeeded, setSucceeded] = useState(false);
  const [refocus, setRefocus] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // The loading button is natively disabled, so the browser moved focus off it. Once it is
  // enabled again, focus returns to it when nothing else took it meanwhile; the result itself is
  // announced (live region or Alert), never focused.
  useEffect(() => {
    if (refocus === 0) return;
    if (focusWasLost(containerRef.current)) focusInView(buttonRef.current);
  }, [refocus, containerRef, buttonRef]);

  function fail(error: ActionError, stage: 'upload' | 'register', name: string) {
    setState({ phase: 'error', view: uploadErrorView(error, stage), name });
    setRefocus((count) => count + 1);
  }

  async function start(file: File): Promise<void> {
    if (state.phase === 'uploading' || state.phase === 'registering') return;
    setAnnouncement('');
    const checked = precheck(kinds, file);
    if ('problem' in checked) {
      setState({ phase: 'error', view: { kind: 'validation', key: checked.problem }, name: file.name });
      return;
    }
    const { kind } = checked;
    const name = file.name;
    setState({ phase: 'uploading', name, percent: 0 });

    let uploaded: Awaited<ReturnType<typeof uploadFile>>;
    try {
      uploaded = await uploadFile(
        uploadArgs(target, file, kind, (percent) => {
          if (!mounted.current) return;
          setState((current) =>
            current.phase === 'uploading' ? { ...current, percent } : current,
          );
        }),
      );
    } catch (error) {
      if (mounted.current) fail(toActionError(error), 'upload', name);
      return;
    }
    if (!mounted.current) return;

    setState({ phase: 'registering', name });
    let error: ActionError;
    try {
      const result = await registerUploadAction(registerInput(target, kind, uploaded));
      if (!mounted.current) return;
      if (result.ok) {
        onUploaded(result.data);
        setState({ phase: 'idle' });
        setSucceeded(true);
        setAnnouncement(doneMessage(result.data.file.fileName));
        setRefocus((count) => count + 1);
        return;
      }
      error = result.error;
    } catch {
      if (!mounted.current) return;
      error = { code: 'internal' };
    }
    fail(error, 'register', name);
  }

  return { state, announcement, succeeded, start };
}
