import 'server-only';

// The one place where runAction meets the session code; its unit tests mock this module.
export { assertSessionNotRevoked, getSession } from '@/lib/auth/session';
