import './globals.css';

// Serves URLs that match no locale, so [locale]/layout.tsx never ran: this page supplies its
// own document and has no message catalog to read, which is why its copy is fixed English.
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm font-semibold text-brand-600">404</p>
          <h1 className="text-2xl font-semibold">Page not found</h1>
          <p className="max-w-md text-ink-muted">
            The page you are looking for does not exist or has been moved.
          </p>
          {/* A full page load on purpose: this document has no locale, and the proxy sends "/" to
              the visitor's one. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            className="mt-3 rounded-control bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Go to the home page
          </a>
        </main>
      </body>
    </html>
  );
}
