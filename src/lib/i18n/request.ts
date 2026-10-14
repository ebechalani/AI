import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { NAMESPACES, type Namespace } from './namespaces';
import { routing } from './routing';

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

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const contents = await Promise.all(
    NAMESPACES.map((namespace) => loadNamespace(locale, namespace)),
  );
  const messages = Object.fromEntries(
    NAMESPACES.map((namespace, index) => [namespace, contents[index]]),
  );

  return { locale, messages };
});
