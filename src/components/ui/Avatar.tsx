import { AVATAR_IDS, DEFAULT_AVATAR_ID, type AvatarId } from '@/lib/avatars';
import { cn } from '@/lib/utils';
import { AVATAR_ART } from './avatar-art';

const SIZES = {
  xs: 'size-6',
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-14',
  xl: 'size-20',
} as const;

export type AvatarSize = keyof typeof SIZES;

export interface AvatarProps {
  /** One of `AVATAR_IDS`; anything else renders `DEFAULT_AVATAR_ID`. */
  avatarId: string;
  size?: AvatarSize;
  /**
   * Names the image. Leave it out when the person's name is printed next to the avatar: the
   * avatar is then decorative and hidden from screen readers.
   */
  label?: string;
  className?: string;
}

function isAvatarId(value: string): value is AvatarId {
  return (AVATAR_IDS as readonly string[]).includes(value);
}

export function Avatar({ avatarId, size = 'md', label, className }: AvatarProps) {
  const art = AVATAR_ART[isAvatarId(avatarId) ? avatarId : DEFAULT_AVATAR_ID];
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('inline-flex shrink-0 rounded-full', SIZES[size], className)}
      style={{ backgroundImage: `linear-gradient(135deg, ${art.from}, ${art.to})` }}
    >
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className="size-full">
        {art.glyph(art.to)}
      </svg>
    </span>
  );
}
