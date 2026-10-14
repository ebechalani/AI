import { useLocale, useTimeZone, useTranslations } from 'next-intl';
import { formatDate, type DateStyle } from '@/lib/utils';

/**
 * Dates in the time zone next-intl hands to server and client components alike, so a card
 * rendered on the server and hydrated in the browser prints the same day.
 */
export function useDateFormat(): (value: string, style?: DateStyle) => string {
  const locale = useLocale();
  const timeZone = useTimeZone();
  return (value, style = 'date') => formatDate(value, locale, style, timeZone);
}

/** "45 min", "2 h", "1 h 30 min". */
export function useDurationFormat(): (minutes: number) => string {
  const t = useTranslations('common');
  return (total) => {
    const rounded = Math.max(0, Math.round(total));
    const hours = Math.floor(rounded / 60);
    const minutes = rounded % 60;
    if (hours === 0) return t('units.minutesShort', { count: minutes });
    if (minutes === 0) return t('units.hoursShort', { count: hours });
    return t('units.hoursMinutesShort', { hours, minutes });
  };
}

/** "Ages 8–10", "Ages 13+", "Up to age 12", or null when the content has no age range. */
export function useAgeRangeLabel(): (
  ageMin: number | null,
  ageMax: number | null,
) => string | null {
  const t = useTranslations('domain');
  return (min, max) => {
    if (min !== null && max !== null) return t('course.ages', { min, max });
    if (min !== null) return t('course.agesFrom', { min });
    if (max !== null) return t('course.agesUpTo', { max });
    return null;
  };
}
