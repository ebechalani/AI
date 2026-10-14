import { USERNAME_PATTERN } from '@/lib/limits';

/**
 * School-provisioned students have no email address: their Auth account uses
 * `{username}@student.roboholic.invalid`. `.invalid` is a reserved top-level domain, so no
 * mail can ever be delivered to it.
 */
export const STUDENT_EMAIL_DOMAIN = 'student.roboholic.invalid';

const STUDENT_EMAIL_SUFFIX = `@${STUDENT_EMAIL_DOMAIN}`;

export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username);
}

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}${STUDENT_EMAIL_SUFFIX}`;
}

/** What the login form accepts, "email or username", as the email of the Auth account. */
export function identifierToEmail(identifier: string): string {
  const value = identifier.trim().toLowerCase();
  return value.includes('@') ? value : usernameToEmail(value);
}

/** True for the synthetic address of a username account, which is never verified or mailed. */
export function isUsernameAccountEmail(email: string | null | undefined): boolean {
  return typeof email === 'string' && email.toLowerCase().endsWith(STUDENT_EMAIL_SUFFIX);
}
