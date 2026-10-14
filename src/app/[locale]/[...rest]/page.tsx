import { notFound } from 'next/navigation';

// Any path under a valid locale that no route serves: renders the locale's not-found page
// (with its layout and messages) instead of the global, English-only one.
export default function CatchAllPage() {
  notFound();
}
