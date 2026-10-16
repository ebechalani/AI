import os from 'node:os';
import path from 'node:path';
import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

const FIREBASE_STORAGE = 'https://firebasestorage.googleapis.com';
const CLOUD_STORAGE = 'https://storage.googleapis.com';

// Must stay equal to EMBED_HOSTS in src/lib/learning/embed-allowlist.ts: a host missing here
// is blocked by the browser even though toEmbedUrl() accepts it.
const EMBED_FRAME_SOURCES = ['https://www.youtube-nocookie.com', 'https://player.vimeo.com'];

const EMULATOR_SOURCES = isDev
  ? ['http://127.0.0.1:9099', 'http://127.0.0.1:9199', 'http://localhost:*']
  : [];

// A static header cannot carry a nonce, hence 'unsafe-inline' for scripts.
const contentSecurityPolicy = [
  ["default-src 'self'"],
  ["script-src 'self' 'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
  ["style-src 'self' 'unsafe-inline'"],
  ["font-src 'self'"],
  ["img-src 'self' data: blob:", FIREBASE_STORAGE, CLOUD_STORAGE, ...EMULATOR_SOURCES],
  ["media-src 'self' blob:", FIREBASE_STORAGE, CLOUD_STORAGE, ...EMULATOR_SOURCES],
  [
    "connect-src 'self'",
    'https://identitytoolkit.googleapis.com',
    'https://securetoken.googleapis.com',
    FIREBASE_STORAGE,
    ...EMULATOR_SOURCES,
  ],
  ['frame-src', ...EMBED_FRAME_SOURCES],
  ["object-src 'none'"],
  ["base-uri 'self'"],
  ["form-action 'self'"],
  ["frame-ancestors 'none'"],
]
  .map((directive) => directive.join(' '))
  .join('; ');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com', pathname: '/v0/b/**' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
        ],
      },
      // Files of learners and of private courses (ARCHITECTURE.md 1.4, 6.9). Must come after the
      // catch-all: the last matching entry wins for a key. The route's own header cannot do it,
      // because Next writes the config headers first and keeps them over the handler's.
      {
        source: '/api/files/:path*',
        headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }],
      },
    ];
  },
};

const I18N_REQUEST_CONFIG = './src/lib/i18n/request.ts';

export default async function config(): Promise<NextConfig> {
  // The plugin loads @swc/core, whose native addon unpacks itself into a per-user cache. On
  // Windows it refuses a cache directory that another principal may replace, and a cache file
  // that has a second hard link. Its default location (%LOCALAPPDATA%\swc) fails the first
  // check on machines where a sandboxed app was granted AppData. A cache inside the project
  // fails the second one whenever the checkout sits in a folder that a sync client backs up
  // (Google Drive hard-links every file waiting for upload). ~/.cache/swc avoids both. SWC falls
  // back to its default when this path is unusable. This has to run before the plugin is
  // imported, hence the dynamic import.
  if (process.platform === 'win32') {
    process.env.SWC_NATIVE_BINDING_CACHE ??= path.join(os.homedir(), '.cache', 'swc');
  }
  const { default: createNextIntlPlugin } = await import('next-intl/plugin');
  return createNextIntlPlugin(I18N_REQUEST_CONFIG)(nextConfig);
}
