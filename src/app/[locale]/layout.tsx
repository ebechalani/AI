import '../globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { TimeZoneCookie } from '@/components/layout';
import { ToastProvider } from '@/components/ui';
import { getDirection } from '@/lib/i18n/config';
import { routing } from '@/lib/i18n/routing';

const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-inter', display: 'swap' });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'common' });
  return {
    title: { default: t('appName'), template: `%s · ${t('appName')}` },
    description: t('description'),
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  // The segment also receives paths the proxy never saw (anything with a file extension).
  if (!hasLocale(routing.locales, locale)) notFound();
  // Lets next-intl read the locale without the proxy's request header. (Pages are rendered
  // dynamically anyway: the request config reads the time zone cookie, src/lib/i18n/request.ts.)
  setRequestLocale(locale);

  return (
    <html lang={locale} dir={getDirection(locale)} className={inter.variable}>
      <body>
        {/* Inherits the request config's locale, messages and time zone (the viewer's,
            recorded by TimeZoneCookie), so server and client format dates alike. */}
        <NextIntlClientProvider>
          <TimeZoneCookie />
          <ToastProvider>{children}</ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
