// The attributes of every iframe the player renders (video and embed blocks). The page's CSP
// frame-src lists exactly the hosts that toEmbedUrl() lets through.
export const FRAME_ATTRIBUTES = {
  loading: 'lazy',
  allow: 'encrypted-media; picture-in-picture; fullscreen',
  allowFullScreen: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  sandbox:
    'allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox',
} as const;
