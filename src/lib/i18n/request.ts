import { cookies } from 'next/headers';
import { unstable_rethrow } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { NAMESPACES, type Namespace } from './namespaces';
import { routing } from './routing';
import { DEFAULT_TIME_ZONE, resolveTimeZone, TIME_ZONE_COOKIE } from './time-zone';

type NamespaceMessages = Record<string, unknown>;

function isModuleNotFound(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    (error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND' ||
    error.message.startsWith('Cannot find module')
  );
}

// Namespaces are written by different workstreams at different times, so a file that does not
// exist yet yields an empty namespace instead of failing every page of the locale.
async function loadNamespace(locale: string, namespace: Namespace): Promise<NamespaceMessages> {
  try {
    const file = (await import(`../../messages/${locale}/${namespace}.json`)) as {
      default: NamespaceMessages;
    };
    return file.default;
  } catch (error) {
    if (isModuleNotFound(error)) return {};
    throw error;
  }
}

// The viewer's zone, recorded by TimeZoneCookie (ARCHITECTURE.md 12); UTC while the cookie is
// missing or names a zone this runtime does not know. Reading the cookie renders every page
// dynamically; the pages that show dates already were (they read the session cookie).
async function viewerTimeZone(): Promise<string> {
  try {
    return resolveTimeZone((await cookies()).get(TIME_ZONE_COOKIE)?.value);
  } catch (error) {
    // Next's own signals (a static render bailing out to a dynamic one) belong to Next.
    unstable_rethrow(error);
    // Called outside a request, where there is no cookie to read.
    return DEFAULT_TIME_ZONE;
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const [contents, timeZone] = await Promise.all([
    Promise.all(NAMESPACES.map((namespace) => loadNamespace(locale, namespace))),
    viewerTimeZone(),
  ]);
  const messages = Object.fromEntries(
    NAMESPACES.map((namespace, index) => [namespace, contents[index]]),
  );

  return { locale, messages, timeZone };
});
