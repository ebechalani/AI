// Browser only. The Firebase Auth client does two things here: it turns a password into an ID
// token for createSessionAction, and it gives direct Storage uploads a `request.auth`. Its
// state lives in memory (see getClientAuth); the session is the server's cookie.

import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
} from 'firebase/auth';
import { getClientAuthTokenAction } from '@/actions/session';
import {
  AppError,
  ConflictError,
  ForbiddenError,
  RateLimitError,
  UnauthenticatedError,
  ValidationError,
} from '@/lib/errors';
import { getClientAuth } from '@/lib/firebase/client';
import { identifierToEmail, isUsernameAccountEmail } from './username';

// Firebase answers a wrong password and an unknown account alike, on purpose; so does this.
const WRONG_CREDENTIALS = new Set([
  'auth/invalid-credential',
  'auth/invalid-login-credentials',
  'auth/wrong-password',
  'auth/user-not-found',
  'auth/missing-password',
  'auth/missing-email',
]);

/**
 * Every function of this module fails with an AppError, so a form handles a failed sign-in
 * the way it handles a failed action, by `error.code`:
 * `unauthenticated` wrong email, username or password · `forbidden` the account is disabled ·
 * `rate_limited` Firebase is throttling this device · `conflict` the email is already
 * registered · `validation` with `fieldErrors` · `internal` anything else, a network failure
 * included. The Firebase code is kept as `message`, for the console only.
 */
function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const code = error instanceof FirebaseError ? error.code : '';
  if (WRONG_CREDENTIALS.has(code)) return new UnauthenticatedError(code);
  if (code === 'auth/user-disabled') return new ForbiddenError(code);
  if (code === 'auth/too-many-requests') return new RateLimitError(null, code);
  if (code === 'auth/email-already-in-use') return new ConflictError(code);
  if (code === 'auth/invalid-email') {
    return new ValidationError(code, { email: ['invalid_email'] });
  }
  if (code === 'auth/weak-password' || code === 'auth/password-does-not-meet-requirements') {
    return new ValidationError(code, { password: ['password_too_short'] });
  }
  return new AppError('internal', code || (error instanceof Error ? error.message : undefined));
}

// Firebase writes its emails in the language of the page that asked for them.
function authForEmail(): Auth {
  const auth = getClientAuth();
  auth.languageCode = document.documentElement.lang || null;
  return auth;
}

/**
 * Signs in with "email or username" and returns a fresh ID token for createSessionAction,
 * which accepts it for five minutes.
 */
export async function signInWithIdentifier(
  identifier: string,
  password: string,
): Promise<{ idToken: string }> {
  try {
    const { user } = await signInWithEmailAndPassword(
      getClientAuth(),
      identifierToEmail(identifier),
      password,
    );
    return { idToken: await user.getIdToken() };
  } catch (error) {
    // Here a malformed address is one more identifier that matches no account.
    if (error instanceof FirebaseError && error.code === 'auth/invalid-email') {
      throw new UnauthenticatedError(error.code);
    }
    throw toAppError(error);
  }
}

/** Creates the Auth account of a self sign-up; completeSignupAction then writes the profile. */
export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<{ idToken: string }> {
  try {
    const { user } = await createUserWithEmailAndPassword(
      getClientAuth(),
      email.trim().toLowerCase(),
      password,
    );
    return { idToken: await user.getIdToken() };
  } catch (error) {
    throw toAppError(error);
  }
}

/** For the user currently signed in on this page, that is, right after signUpWithEmail. */
export async function sendVerificationEmail(): Promise<void> {
  const user = authForEmail().currentUser;
  if (user === null) throw new UnauthenticatedError('No client user to send a verification to.');
  try {
    await sendEmailVerification(user);
  } catch (error) {
    throw toAppError(error);
  }
}

/**
 * Resolves whether or not an account has that address, so the form cannot be used to find out
 * who is registered. A username account has no mailbox: nothing is sent.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  const address = email.trim().toLowerCase();
  if (isUsernameAccountEmail(address)) return;
  try {
    await sendPasswordResetEmail(authForEmail(), address);
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/user-not-found') return;
    throw toAppError(error);
  }
}

let signingIn: Promise<void> | null = null;

async function signInFromSession(): Promise<void> {
  const result = await getClientAuthTokenAction();
  if (!result.ok) throw new AppError(result.error.code, 'No client auth token.');
  try {
    await signInWithCustomToken(getClientAuth(), result.data.customToken);
  } catch (error) {
    throw toAppError(error);
  }
}

/**
 * Makes sure the Firebase client is signed in, which a direct Storage upload needs. Client
 * auth lives in memory, so after a page load there is no user: the server then mints a custom
 * token for the session's uid. `force` signs in again even when a user is present, for a
 * client token that Storage no longer accepts.
 *
 * Throws AppError('unauthenticated') when the server session is gone; the caller sends the
 * user to /login.
 */
export async function ensureClientAuth(options?: { force?: boolean }): Promise<void> {
  const auth = getClientAuth();
  await auth.authStateReady();
  if (auth.currentUser !== null && options?.force !== true) return;
  // Several uploads may start at once; they share one round trip.
  signingIn ??= signInFromSession().finally(() => {
    signingIn = null;
  });
  return signingIn;
}

/**
 * Forgets the client user. Never throws: the state is in memory and goes with the tab anyway,
 * and nothing must keep the caller from reaching signOutAction(), which ends the session.
 */
export async function signOutClient(): Promise<void> {
  try {
    await signOut(getClientAuth());
  } catch {
    // Nothing to undo, and nothing the user could do about it.
  }
}
