import { mediaUrl } from '@/lib/firebase/storage-paths';
import { toVideoEmbedUrl } from '@/lib/learning/embed-allowlist';
import type { BlockDataMap } from '@/types/content';

/**
 * The seed's placeholder video ids (RoboHolic01…): valid ids that name no real video yet, so
 * the player shows them as unavailable instead of an embed that cannot play.
 */
export const PLACEHOLDER_VIDEO_ID = /^RoboHolic\d{2}$/;

export type VideoPlayback =
  { kind: 'embed'; src: string } | { kind: 'file'; src: string } | { kind: 'unavailable' };

/** How a video block plays: a YouTube or Vimeo iframe, an uploaded file, or not at all. */
export function videoPlayback(
  data: Pick<BlockDataMap['video'], 'source' | 'videoId' | 'media'>,
): VideoPlayback {
  if (data.source === 'file') {
    return data.media ? { kind: 'file', src: mediaUrl(data.media) } : { kind: 'unavailable' };
  }
  if (!data.videoId || PLACEHOLDER_VIDEO_ID.test(data.videoId)) return { kind: 'unavailable' };
  const src = toVideoEmbedUrl(data.source, data.videoId);
  return src === null ? { kind: 'unavailable' } : { kind: 'embed', src };
}
