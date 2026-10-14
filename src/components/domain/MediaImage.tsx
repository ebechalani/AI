import Image from 'next/image';
import { mediaUrl } from '@/lib/firebase/storage-paths';
import { cn } from '@/lib/utils';
import type { MediaRef } from '@/types/common';

const FRAMES = { '16:9': 'aspect-video', '4:3': 'aspect-4/3', '1:1': 'aspect-square' } as const;

export interface MediaImageProps {
  media: MediaRef;
  /** Empty for a decorative image (a card cover next to the card's title). */
  alt: string;
  sizes?: string;
  /** Preloads the image: for the one that is the page's largest above the fold. */
  priority?: boolean;
  /**
   * Crops the image to fill a box of this ratio (a card cover). Without it the image keeps its
   * own proportions, or sits uncropped in a 16:9 box when its dimensions are unknown.
   */
  frame?: keyof typeof FRAMES;
  /** Goes to the outermost element: the box when there is one, else the image. */
  className?: string;
}

/** The only way an uploaded image is rendered (ARCHITECTURE.md 7.4). */
export function MediaImage({
  media,
  alt,
  sizes = '100vw',
  priority = false,
  frame,
  className,
}: MediaImageProps) {
  const src = mediaUrl(media);
  // Only official media on the Storage host is optimised. /api/files needs the session cookie,
  // which the optimiser does not have, and the Storage emulator is a local address.
  const unoptimized = !src.startsWith('https://');
  const shared = { src, sizes, unoptimized, preload: priority };

  if (frame === undefined && media.width !== null && media.height !== null) {
    return (
      <Image
        {...shared}
        alt={alt}
        width={media.width}
        height={media.height}
        className={cn('h-auto max-w-full', className)}
      />
    );
  }

  return (
    <span
      className={cn(
        'relative block overflow-hidden bg-surface-muted',
        FRAMES[frame ?? '16:9'],
        className,
      )}
    >
      <Image {...shared} alt={alt} fill className={frame ? 'object-cover' : 'object-contain'} />
    </span>
  );
}
