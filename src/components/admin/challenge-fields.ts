import type { ChallengeFormValues } from './challenge-model';

// What the six sections of the challenge editor share: the form values, the change handler,
// the field errors (by the paths of 4.8 `claimsChallengePath`, `rubric.*` collapsed into
// `rubric`) and the pending flag.

export type ChallengeErrors = Record<string, string>;

export interface ChallengeFieldsProps {
  values: ChallengeFormValues;
  onChange: (values: ChallengeFormValues) => void;
  errors: ChallengeErrors;
  disabled: boolean;
}

/** A hardware kit the editor offers (active ones, plus any the challenge already names). */
export interface PlatformChoice {
  id: string;
  name: string;
  vendor: string | null;
}

export const SECTION_LEGEND = 'mb-2 text-lg font-semibold text-ink';

/** Adds or removes `item` in a list, keeping the order of first ticking. */
export function toggleItem<T>(list: readonly T[], item: T, present: boolean): T[] {
  const without = list.filter((entry) => entry !== item);
  return present ? [...without, item] : without;
}
