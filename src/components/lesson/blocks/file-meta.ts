// The type and size line of a downloadable file ("PDF · 1.2 MB"). Pure, for the unit tests.

const KB = 1024;
const MB = 1024 * KB;

// Content types whose subtype says nothing a learner recognises.
const GENERIC_SUBTYPES = new Set(['octet-stream', 'x-binary']);
// Subtypes whose usual extension is the better-known name.
const SUBTYPE_NAMES: Record<string, string> = { plain: 'TXT', mpeg: 'MP3', jpeg: 'JPG' };

/**
 * A short upper-case type: the file's extension ("PDF", "DOCX", "SB3"), else the content type's
 * subtype ("PNG" from image/png), else an empty string.
 */
export function fileTypeLabel(fileName: string, contentType: string): string {
  const extension = /\.([A-Za-z0-9]{1,10})$/.exec(fileName)?.[1];
  if (extension) return extension.toUpperCase();
  const subtype = contentType.split(';')[0]?.split('/')[1]?.trim().toLowerCase() ?? '';
  if (subtype === '' || GENERIC_SUBTYPES.has(subtype)) return '';
  // vnd.openxmlformats-officedocument.wordprocessingml.document → DOCUMENT; x-zip → ZIP.
  const last = (subtype.split(/[.+]/).pop() ?? subtype).replace(/^x-/, '');
  return Object.hasOwn(SUBTYPE_NAMES, last) ? SUBTYPE_NAMES[last]! : last.toUpperCase();
}

export interface FileSize {
  /** The `common.units` key the value goes into. */
  unit: 'kilobytes' | 'megabytes';
  /** Rounded to one decimal; the caller formats it for the locale. */
  value: number;
}

function oneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Kilobytes below one megabyte, megabytes from there; a non-empty file is never "0 KB". */
export function fileSize(sizeBytes: number): FileSize {
  const bytes = Number.isFinite(sizeBytes) ? Math.max(0, sizeBytes) : 0;
  const kilobytes = oneDecimal(bytes / KB);
  if (kilobytes < 1024) {
    return { unit: 'kilobytes', value: bytes > 0 && kilobytes === 0 ? 0.1 : kilobytes };
  }
  return { unit: 'megabytes', value: oneDecimal(bytes / MB) };
}
