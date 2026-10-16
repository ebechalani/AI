import type { Challenge } from '@/types/challenge';
import type { Course } from '@/types/content';
import type {
  HardwareCapability,
  HardwareConnectivity,
  HardwareKind,
  HardwarePlatform,
  ProgrammingMode,
} from '@/types/hardware';

// The Robotics page as plain data (ARCHITECTURE.md 3.4 "Hardware", 3.7 "Student Robotics").

/** The project themes of the Robotics page; each one is a course tag. */
export const ROBOTICS_THEMES = ['vision', 'sensors', 'autonomous'] as const;
export type RoboticsTheme = (typeof ROBOTICS_THEMES)[number];

// The unions have no value tuple in src/types: a record keyed by the union is complete by
// construction (a missing or extra key fails to compile), and its keys are the list.
const KINDS: Record<HardwareKind, null> = {
  robot: null,
  microcontroller: null,
  sensor_kit: null,
  simulator: null,
};
export const HARDWARE_KINDS = Object.keys(KINDS) as HardwareKind[];

const MODES: Record<ProgrammingMode, null> = {
  blocks: null,
  python: null,
  javascript: null,
  cpp: null,
};
export const PROGRAMMING_MODES = Object.keys(MODES) as ProgrammingMode[];

const LINKS: Record<HardwareConnectivity, null> = {
  usb: null,
  bluetooth: null,
  wifi: null,
  none: null,
};
export const CONNECTIVITY = Object.keys(LINKS) as HardwareConnectivity[];

/** Published official robotics courses a student may open (the area query does not filter audience). */
export function studentRoboticsCourses(courses: readonly Course[]): Course[] {
  return courses.filter((course) => course.audience === 'student');
}

/** One list per theme; a course with several theme tags is in each of them; order kept. */
export function coursesByTheme(courses: readonly Course[]): Record<RoboticsTheme, Course[]> {
  return {
    vision: courses.filter((course) => course.tags.includes('vision')),
    sensors: courses.filter((course) => course.tags.includes('sensors')),
    autonomous: courses.filter((course) => course.tags.includes('autonomous')),
  };
}

/** Robot challenges among open and upcoming ones; order kept (soonest deadline first). */
export function roboticsChallenges(challenges: readonly Challenge[]): Challenge[] {
  return challenges.filter((challenge) => challenge.area === 'robotics');
}

/** A platform qualifies when its capabilities are a superset of the requirement (3.4); [] → true. */
export function supportsCapabilities(
  platform: Pick<HardwarePlatform, 'capabilities'>,
  required: readonly HardwareCapability[],
): boolean {
  return required.every((capability) => platform.capabilities.includes(capability));
}

/**
 * Courses with at least one required capability that the platform covers entirely. A course
 * that requires nothing is not listed: "works for" would then name every course on every kit.
 */
export function coursesForPlatform(
  platform: Pick<HardwarePlatform, 'capabilities'>,
  courses: readonly Course[],
): Course[] {
  return courses.filter(
    (course) =>
      course.requiredCapabilities.length > 0 &&
      supportsCapabilities(platform, course.requiredCapabilities),
  );
}

/** The most frequent non-null pathwayId (ties: the first in course order); null when none. */
export function mainPathwayId(courses: readonly Course[]): string | null {
  const counts = new Map<string, number>();
  for (const { pathwayId } of courses) {
    if (pathwayId !== null) counts.set(pathwayId, (counts.get(pathwayId) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  // A Map iterates in insertion order, which is course order: a strict > keeps the first tie.
  for (const [pathwayId, count] of counts) {
    if (count > bestCount) {
      best = pathwayId;
      bestCount = count;
    }
  }
  return best;
}
