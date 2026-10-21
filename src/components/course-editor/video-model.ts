// What an author types into a video block: a link or an id, and a duration.

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{1,12}$/;
const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com']);
const NOCOOKIE_HOSTS = new Set(['youtube-nocookie.com', 'www.youtube-nocookie.com']);
const VIMEO_HOSTS = new Set(['vimeo.com', 'www.vimeo.com']);

function parseUrl(text: string): URL | null {
  const candidates = /^[a-z]+:\/\//i.test(text) ? [text] : [text, `https://${text}`];
  for (const candidate of candidates) {
    try {
      const url = new URL(candidate);
      if (url.protocol === 'https:' || url.protocol === 'http:') return url;
    } catch {
      // Not a URL; try the next form.
    }
  }
  return null;
}

function segments(url: URL): string[] {
  return url.pathname.split('/').filter((part) => part !== '');
}

function youtubeId(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  const parts = segments(url);
  let candidate: string | null | undefined = null;
  if (host === 'youtu.be') candidate = parts[0];
  else if (YOUTUBE_HOSTS.has(host)) {
    if (parts[0] === 'watch') candidate = url.searchParams.get('v');
    else if (parts[0] === 'embed' || parts[0] === 'shorts') candidate = parts[1];
  } else if (NOCOOKIE_HOSTS.has(host) && parts[0] === 'embed') candidate = parts[1];
  return candidate && YOUTUBE_ID.test(candidate) ? candidate : null;
}

function vimeoId(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  const parts = segments(url);
  let candidate: string | undefined;
  if (VIMEO_HOSTS.has(host)) {
    if (parts.length === 1) candidate = parts[0];
    else if (parts[0] === 'channels' && parts.length === 3) candidate = parts[2];
  } else if (host === 'player.vimeo.com' && parts[0] === 'video') candidate = parts[1];
  return candidate && VIMEO_ID.test(candidate) ? candidate : null;
}

/** The video id in a bare id or in one of the usual link shapes; null when there is none. */
export function extractVideoId(source: 'youtube' | 'vimeo', text: string): string | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const bare = source === 'youtube' ? YOUTUBE_ID : VIMEO_ID;
  if (bare.test(trimmed)) return trimmed;
  const url = parseUrl(trimmed);
  if (url === null) return null;
  return source === 'youtube' ? youtubeId(url) : vimeoId(url);
}

/**
 * '' → null; 'ss', 'm:ss' or 'h:mm:ss' (the later parts 0–59) → seconds; anything else → NaN,
 * which the schema answers with `invalid_number`.
 */
export function parseDuration(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const parts = trimmed.split(':');
  if (parts.length > 3) return Number.NaN;
  const [first, ...rest] = parts;
  if (!/^\d+$/.test(first!) || rest.some((part) => !/^\d{1,2}$/.test(part))) return Number.NaN;
  if (rest.some((part) => Number(part) > 59)) return Number.NaN;
  return parts.reduce((total, part) => total * 60 + Number(part), 0);
}

/** null → ''; under an hour 'm:ss', else 'h:mm:ss'. */
export function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return '';
  const whole = Math.floor(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secs = String(whole % 60).padStart(2, '0');
  return hours === 0 ? `${minutes}:${secs}` : `${hours}:${String(minutes).padStart(2, '0')}:${secs}`;
}
