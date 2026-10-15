import { VideoOff } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useDurationFormat } from '@/components/domain';
import { pickTranslation } from '@/lib/i18n/content';
import { FRAME_ATTRIBUTES } from './frame';
import type { BlockRendererProps } from './registry';
import { videoPlayback, type VideoPlayback } from './video-source';

function VideoFrame({ playback, title }: { playback: VideoPlayback; title: string }) {
  const t = useTranslations('lesson');
  if (playback.kind === 'embed') {
    return (
      <div className="relative aspect-video overflow-hidden rounded-card bg-ink">
        <iframe
          src={playback.src}
          title={t('blocks.video.frameTitle', { title })}
          className="absolute inset-0 size-full"
          {...FRAME_ATTRIBUTES}
        />
      </div>
    );
  }
  if (playback.kind === 'file') {
    return (
      <video
        controls
        preload="metadata"
        src={playback.src}
        className="aspect-video w-full rounded-card bg-ink"
      >
        {t('blocks.video.noSupport')}
      </video>
    );
  }
  return null;
}

/**
 * A YouTube (nocookie) or Vimeo iframe, or an uploaded file; a video that cannot play shows a
 * placeholder and opens the transcript instead.
 */
export function VideoBlock({ block }: BlockRendererProps<'video'>) {
  const t = useTranslations('lesson');
  const formatDuration = useDurationFormat();
  const text = pickTranslation(block.translations, useLocale(), block.defaultLocale);
  const playback = videoPlayback(block.data);
  const unavailable = playback.kind === 'unavailable';
  const seconds = block.data.durationSeconds;

  return (
    <figure className="flex flex-col gap-3">
      <h3 className="text-lg leading-snug font-semibold text-ink">{text.title}</h3>
      {unavailable ? (
        <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-card border border-dashed border-ink-muted/40 bg-surface-muted/50 p-6 text-center">
          <VideoOff aria-hidden="true" className="size-8 text-ink-muted" />
          <p className="font-semibold text-ink">{t('blocks.video.unavailable')}</p>
          {text.transcript && (
            <p className="text-sm text-ink-muted">{t('blocks.video.unavailableHint')}</p>
          )}
        </div>
      ) : (
        <VideoFrame playback={playback} title={text.title} />
      )}
      {(text.caption || (seconds !== null && seconds > 0)) && (
        <figcaption className="flex flex-col gap-0.5 text-sm text-ink-muted">
          {text.caption && <span>{text.caption}</span>}
          {seconds !== null && seconds > 0 && (
            <span>
              {t('blocks.video.duration', { duration: formatDuration(Math.ceil(seconds / 60)) })}
            </span>
          )}
        </figcaption>
      )}
      {text.transcript && (
        <details open={unavailable} className="group rounded-control border border-border">
          <summary className="flex min-h-11 cursor-pointer items-center rounded-control px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50">
            {t('blocks.video.transcript')}
          </summary>
          <p className="border-t border-border px-4 py-3 text-sm leading-relaxed whitespace-pre-line text-ink">
            {text.transcript}
          </p>
        </details>
      )}
    </figure>
  );
}
