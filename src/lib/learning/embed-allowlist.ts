import { EMBED_HOSTS } from '@/lib/limits';

export { EMBED_HOSTS };

/**
 * The `src` for an embed iframe, or null when the URL may not be framed: it must be an https
 * URL on one of EMBED_HOSTS, with no port and no credentials (the page's frame-src directive
 * lists the bare hosts). Same rule as isEmbeddableUrl in schemas/course, which authors'
 * input goes through; the player checks again because a stored URL is still only data.
 */
export function toEmbedUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const allowed =
    parsed.protocol === 'https:' &&
    EMBED_HOSTS.includes(parsed.hostname) &&
    parsed.port === '' &&
    parsed.username === '' &&
    parsed.password === '';
  return allowed ? parsed.href : null;
}

/**
 * The player URL of a video block that names a YouTube or Vimeo video by id; null when the
 * player's host is no longer in EMBED_HOSTS.
 */
export function toVideoEmbedUrl(source: 'youtube' | 'vimeo', videoId: string): string | null {
  const id = encodeURIComponent(videoId);
  return toEmbedUrl(
    source === 'youtube'
      ? `https://www.youtube-nocookie.com/embed/${id}`
      : `https://player.vimeo.com/video/${id}`,
  );
}
