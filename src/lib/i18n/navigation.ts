import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Locale-aware replacements for next/link and the next/navigation router: every href is a
// locale-less path ('/student/learn') and the active locale is prefixed for the caller.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
