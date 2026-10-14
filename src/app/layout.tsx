import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'RoboHolic AI',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
};

// <html> and <body> come from [locale]/layout.tsx, the first segment that knows the locale.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
