// Turns a parse's field errors into messages under the fields a form shows.

export interface RoutedErrors<F extends string> {
  /** The first message of each field the form shows. */
  fields: Partial<Record<F, string>>;
  /** Paths no field of the form shows: the form alert speaks for them. */
  unmatched: string[];
}

export function routeFieldErrors<F extends string>(
  fieldErrors: Record<string, string[]>,
  fieldOf: (path: string) => F | null,
  message: (key: string | undefined, path: string, field: F) => string | undefined,
): RoutedErrors<F> {
  const fields: Partial<Record<F, string>> = {};
  const unmatched: string[] = [];
  for (const [path, keys] of Object.entries(fieldErrors)) {
    const field = fieldOf(path);
    if (field === null) {
      unmatched.push(path);
      continue;
    }
    if (fields[field] === undefined) fields[field] = message(keys[0], path, field);
  }
  return { fields, unmatched };
}
