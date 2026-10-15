import 'server-only';
import { cache } from 'react';
import { getPublishedPathway } from '@/lib/data/pathways';

/** One read per request, shared by `generateMetadata` and the page. */
export const loadPathway = cache((pathwayId: string) => getPublishedPathway(pathwayId));
