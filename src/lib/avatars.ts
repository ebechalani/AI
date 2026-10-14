// This file imports nothing: the profile schema and the Avatar component both build on it.

// Objects rather than faces or mascots, so the same set suits an 8-year-old and a teacher.
export const AVATAR_IDS = [
  'robot',
  'rocket',
  'planet',
  'star',
  'bolt',
  'atom',
  'bulb',
  'gear',
  'chip',
  'compass',
  'satellite',
  'puzzle',
] as const;

export type AvatarId = (typeof AVATAR_IDS)[number];

export const DEFAULT_AVATAR_ID: AvatarId = 'robot';
