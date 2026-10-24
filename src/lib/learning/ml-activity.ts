import { ML_ACTIVITY_HOSTS, ML_WORKSHEET_FILE_PATTERN, ML_WORKSHEET_PREFIXES } from '@/lib/limits';

export { ML_ACTIVITY_HOSTS, ML_WORKSHEET_PREFIXES };

/**
 * The href that opens an ml_activity block on Machine Learning for Kids, or null when the URL
 * may not be opened: it must be an https URL on exactly one of ML_ACTIVITY_HOSTS, with no port
 * and no credentials. Same rule as isMlActivityUrl in schemas/course, which authors' input goes
 * through; the player checks again because a stored URL is still only data.
 *
 * The site is an AngularJS app whose routes live in the hash (`#!/login`), and it reads its
 * interface language from a `lang` parameter of the query, before the hash. `lang=<locale>` is
 * therefore added to the query, unless the author already set one, and the hash is kept as it is.
 */
export function toMlActivityHref(url: string, locale: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const allowed =
    parsed.protocol === 'https:' &&
    ML_ACTIVITY_HOSTS.includes(parsed.hostname) &&
    parsed.port === '' &&
    parsed.username === '' &&
    parsed.password === '';
  if (!allowed) return null;
  // Appended rather than set through searchParams, which would re-encode the author's query.
  if (!parsed.searchParams.has('lang')) {
    const lang = `lang=${encodeURIComponent(locale)}`;
    parsed.search = parsed.search === '' ? lang : `${parsed.search.slice(1)}&${lang}`;
  }
  return parsed.href;
}

/**
 * The URL of an official worksheet, or null when it fails the rule of isMlWorksheetUrl in
 * schemas/course: one of ML_WORKSHEET_PREFIXES (the master branch of IBM/taxinomitis-docs)
 * followed by a PDF file name that matches ML_WORKSHEET_FILE_PATTERN.
 */
export function toMlWorksheetHref(url: string): string | null {
  const allowed = ML_WORKSHEET_PREFIXES.some(
    (prefix) => url.startsWith(prefix) && ML_WORKSHEET_FILE_PATTERN.test(url.slice(prefix.length)),
  );
  return allowed ? url : null;
}

/**
 * True when the worksheet is in French: the official French files end their name in `-fr.pdf`,
 * and every other one is in English.
 */
export function isFrenchWorksheet(url: string): boolean {
  try {
    return new URL(url).pathname.toLowerCase().endsWith('-fr.pdf');
  } catch {
    return false;
  }
}
