'use client';

import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useRefocusWhenLost } from './focus';

export interface RefocusHeadingProps {
  as: 'h2' | 'h3' | 'h4';
  /**
   * Computed on the server from the state the section shows. When it changes (a refresh after
   * an action) and focus was lost, the heading takes it.
   */
  focusKey: string;
  id?: string;
  className?: string;
  children: ReactNode;
}

/**
 * A section heading that takes focus back after a router.refresh() removed or disabled the
 * control that had it (SPEC-D 5.4, 11.3). Server-rendered sections cannot hold refs.
 */
export function RefocusHeading({ as: Tag, focusKey, id, className, children }: RefocusHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  useRefocusWhenLost(ref, focusKey);
  return (
    <Tag ref={ref} id={id} tabIndex={-1} className={cn('outline-none', className)}>
      {children}
    </Tag>
  );
}
