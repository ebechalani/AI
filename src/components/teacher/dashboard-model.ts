import type { SchoolClass } from '@/types/school';

// The pure model of the teacher dashboard. No React, so Vitest can import it.

/** How much each dashboard list shows (ARCHITECTURE.md 3.7: limit 5 and 10). */
export const DASHBOARD_LIMITS = { classes: 6, pending: 5, attempts: 10 } as const;

/** Active and archived classes, each in the order given (by name). */
export function splitClasses(classes: readonly SchoolClass[]): {
  active: SchoolClass[];
  archived: SchoolClass[];
} {
  return {
    active: classes.filter((cls) => !cls.archived),
    archived: classes.filter((cls) => cls.archived),
  };
}

/** Students summed over the classes; courses counted once however many classes assign them. */
export function classTotals(active: readonly SchoolClass[]): {
  classes: number;
  students: number;
  courses: number;
} {
  return {
    classes: active.length,
    students: active.reduce((sum, cls) => sum + cls.studentCount, 0),
    courses: new Set(active.flatMap((cls) => cls.assignedCourseIds)).size,
  };
}

export function classNameMap(classes: readonly SchoolClass[]): Record<string, string> {
  return Object.fromEntries(classes.map((cls) => [cls.id, cls.name]));
}

/** The first word of the name, for the greeting. */
export function firstName(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] ?? '';
}
