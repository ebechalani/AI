import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CONTAINER, PathwayGrid } from '@/components/marketing';
import { listPublishedPathways } from '@/lib/data/pathways';
import { routing } from '@/lib/i18n/routing';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'home' });
  return { title: t('pathwaysPage.title'), description: t('pathwaysPage.description') };
}

export default async function PathwaysPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('home');

  const pathways = await listPublishedPathways();
  const forStudents = pathways.filter((pathway) => pathway.audience === 'student');
  const forTeachers = pathways.filter((pathway) => pathway.audience === 'teacher');

  return (
    <div className={`${CONTAINER} flex flex-col gap-12 py-10 sm:py-14`}>
      <header className="flex max-w-3xl flex-col gap-4">
        <h1 className="text-3xl leading-tight font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
          {t('pathwaysPage.title')}
        </h1>
        <p className="text-lg text-ink-muted">{t('pathwaysPage.description')}</p>
      </header>

      {pathways.length === 0 ? (
        <PathwayGrid
          pathways={pathways}
          emptyTitle={t('pathwaysPage.empty.title')}
          emptyDescription={t('pathwaysPage.empty.description')}
        />
      ) : (
        <>
          <section aria-labelledby="pathways-students" className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 id="pathways-students" className="text-2xl font-bold tracking-tight text-ink">
                {t('pathwaysPage.students.title')}
              </h2>
              <p className="text-ink-muted">{t('pathwaysPage.students.description')}</p>
            </div>
            <PathwayGrid
              pathways={forStudents}
              emptyTitle={t('pathwaysPage.empty.title')}
              emptyDescription={t('pathwaysPage.empty.description')}
            />
          </section>
          {forTeachers.length > 0 && (
            <section aria-labelledby="pathways-teachers" className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h2 id="pathways-teachers" className="text-2xl font-bold tracking-tight text-ink">
                  {t('pathwaysPage.teachers.title')}
                </h2>
                <p className="text-ink-muted">{t('pathwaysPage.teachers.description')}</p>
              </div>
              <PathwayGrid
                pathways={forTeachers}
                emptyTitle={t('pathwaysPage.empty.title')}
                emptyDescription={t('pathwaysPage.empty.description')}
              />
            </section>
          )}
        </>
      )}
    </div>
  );
}
