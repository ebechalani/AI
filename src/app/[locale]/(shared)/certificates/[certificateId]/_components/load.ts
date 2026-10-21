import 'server-only';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { requireRole } from '@/lib/auth/session';
import { getCertificate } from '@/lib/data/certificates';
import { isAppError } from '@/lib/errors';

const VIEWERS = ['student', 'teacher', 'school_admin', 'platform_admin'] as const;

/**
 * One certificate read per request, shared by `generateMetadata` and the page. Missing,
 * malformed and not visible to the viewer are one answer, not found: the page never tells
 * whether a certificate exists (4.4).
 */
export const loadCertificate = cache(async (certificateId: string) => {
  const session = await requireRole(...VIEWERS);
  try {
    return { session, certificate: await getCertificate(session, certificateId) };
  } catch (error) {
    if (isAppError(error) && error.code === 'not_found') notFound();
    throw error;
  }
});
