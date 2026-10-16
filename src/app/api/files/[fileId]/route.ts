import { getSession } from '@/lib/auth/session';
import { isAppError } from '@/lib/errors';
import { serveFile } from '@/lib/firebase/storage-admin';
import { FILE_ID_PATTERN } from '@/lib/firebase/storage-paths';
import { getFileForDownload } from '@/lib/services/project-flow';
import type { FileKind } from '@/types/common';

// GET /api/files/[fileId] (ARCHITECTURE.md 6.9): learner work and the media of private courses,
// for whoever may read them. Every refusal is the same 404 as a missing file (no existence
// oracle), also without a session: a route handler answers, it never redirects to /login.

const NO_STORE = {
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
} as const;

/** Shown in the browser; every other kind downloads (5.2). */
const INLINE_KINDS: readonly FileKind[] = ['image', 'audio', 'video', 'pdf'];

function notFound(): Response {
  return new Response(null, { status: 404, headers: NO_STORE });
}

// The context is typed here, not with the generated RouteContext: the dev server can drop its
// route types while it rebuilds them.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> },
): Promise<Response> {
  const { fileId } = await params;
  if (!FILE_ID_PATTERN.test(fileId)) return notFound();
  const session = await getSession();
  if (session === null) return notFound();

  // `download=1` changes the disposition only, never who may read the file. It is how
  // "Download" works in production, where the answer is a cross-origin redirect to Storage and
  // browsers ignore the `download` attribute of the link.
  const download = new URL(request.url).searchParams.get('download') === '1';
  try {
    const file = await getFileForDownload(session, fileId);
    const inline = INLINE_KINDS.includes(file.kind) && !download;
    return await serveFile(file.storagePath, { inline });
  } catch (error) {
    if (isAppError(error) && (error.code === 'not_found' || error.code === 'forbidden')) {
      return notFound();
    }
    // A real fault: Next answers 500 and logs it.
    throw error;
  }
}
