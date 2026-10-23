// Field errors as the admin forms name them. `runAction` answers the keys of the whole payload
// ('input.name', 'patch.settings.aiDailyMessageLimit'); the repositories that re-parse the inner
// object throw unprefixed keys ('coverImageFileId', 'name'). Pure: no React.

/**
 * Keys as the form names them: a key starting with `prefix` loses it; the others stay.
 * undefined → {}. Two keys that collapse into one concatenate their messages.
 */
export function unprefixFieldErrors(
  fieldErrors: Record<string, string[]> | undefined,
  prefix: string,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [path, messages] of Object.entries(fieldErrors ?? {})) {
    const key = path.startsWith(prefix) ? path.slice(prefix.length) : path;
    result[key] = [...(result[key] ?? []), ...messages];
  }
  return result;
}

/** The first message of a path, or undefined. */
export function firstError(
  fieldErrors: Record<string, string[]>,
  path: string,
): string | undefined {
  return fieldErrors[path]?.[0];
}

/** The paths no field of the form shows (they go to the form-level Alert). */
export function unclaimedPaths(
  fieldErrors: Record<string, string[]>,
  claims: (path: string) => boolean,
): string[] {
  return Object.keys(fieldErrors).filter((path) => !claims(path));
}

/**
 * A number typed in an <input type="number">: '' (after trim) → NaN, which the schemas answer
 * with `invalid_number`; anything else Number(trimmed). Never a bare Number(value): Number('')
 * and Number('  ') are 0, which would turn an empty seats field into `too_small` and an empty
 * XP reward or rubric weight into a silently accepted 0.
 */
export function numberInput(value: string): number {
  const trimmed = value.trim();
  return trimmed === '' ? Number.NaN : Number(trimmed);
}
