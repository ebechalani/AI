import 'server-only';
import type { Actor } from '@/lib/auth/actor';
import { collections } from '@/lib/firebase/collections';
import { fromQuery } from '@/lib/firebase/converters';
import type { HardwarePlatform } from '@/types/hardware';

// Hardware platforms are reference data: written only by migration scripts in the MVP, and
// readable by every signed-in user.

/** In display order. The collection holds a handful of documents, so it is read whole. */
export async function listHardwarePlatforms(
  _actor: Actor,
  opts?: { activeOnly?: boolean },
): Promise<HardwarePlatform[]> {
  const platforms = fromQuery<HardwarePlatform>(await collections.hardwarePlatforms().get());
  return platforms
    .filter((platform) => !opts?.activeOnly || platform.isActive)
    .sort((a, b) => a.order - b.order);
}
