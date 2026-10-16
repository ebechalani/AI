import { describe, expect, it } from 'vitest';
import {
  CONNECTIVITY,
  coursesByTheme,
  coursesForPlatform,
  HARDWARE_KINDS,
  mainPathwayId,
  PROGRAMMING_MODES,
  roboticsChallenges,
  studentRoboticsCourses,
  supportsCapabilities,
} from '@/components/robotics/robotics-model';
import type { HardwareCapability } from '@/types';
import { challenge, course } from './services-fixtures';

// The Robotics page's pure model (ARCHITECTURE.md 3.4 "Hardware", 3.7 "Student Robotics").

const ids = (items: readonly { id: string }[]) => items.map((item) => item.id);

// The seed's robotics course and platforms.
const seedCourse = course({
  id: 'ai-robotics-foundations',
  area: 'robotics',
  pathwayId: 'ai-robotics',
  tags: ['robotics', 'sensors', 'vision', 'autonomous', 'line-following'],
  requiredCapabilities: ['drive', 'distance', 'line'],
});
const platform = (capabilities: HardwareCapability[]) => ({ capabilities });
const simulator = platform(['drive', 'camera', 'distance', 'line', 'color', 'imu', 'display']);
const cameraRover = platform(['drive', 'camera', 'distance', 'line']);
const sensorKit = platform([
  'distance',
  'line',
  'color',
  'imu',
  'microphone',
  'speaker',
  'display',
]);

describe('studentRoboticsCourses', () => {
  it('drops Teacher Academy courses and keeps the order', () => {
    const courses = [
      course({ id: 'a' }),
      course({ id: 'b', audience: 'teacher' }),
      course({ id: 'c' }),
    ];
    expect(ids(studentRoboticsCourses(courses))).toEqual(['a', 'c']);
  });
});

describe('coursesByTheme', () => {
  it('puts a course in every theme it is tagged with, in order', () => {
    const other = course({ id: 'other', tags: ['vision'] });
    const none = course({ id: 'none', tags: ['line-following'] });
    const groups = coursesByTheme([seedCourse, none, other]);
    expect(ids(groups.vision)).toEqual(['ai-robotics-foundations', 'other']);
    expect(ids(groups.sensors)).toEqual(['ai-robotics-foundations']);
    expect(ids(groups.autonomous)).toEqual(['ai-robotics-foundations']);
  });
});

describe('roboticsChallenges', () => {
  it('keeps only robotics challenges, in order', () => {
    const list = [
      challenge({ id: 'r1', area: 'robotics' }),
      challenge({ id: 'c1', area: 'creativity' }),
      challenge({ id: 'r2', area: 'robotics' }),
    ];
    expect(ids(roboticsChallenges(list))).toEqual(['r1', 'r2']);
  });
});

describe('supportsCapabilities', () => {
  it('needs a superset of the requirement', () => {
    expect(supportsCapabilities(cameraRover, ['drive', 'line'])).toBe(true);
    expect(supportsCapabilities(sensorKit, ['drive', 'line'])).toBe(false);
    expect(supportsCapabilities(sensorKit, [])).toBe(true);
  });
});

describe('coursesForPlatform', () => {
  it('lists the courses a platform fits (the seed: simulator and rover, not the kit)', () => {
    const free = course({ id: 'free', requiredCapabilities: [] });
    expect(ids(coursesForPlatform(simulator, [seedCourse, free]))).toEqual([
      'ai-robotics-foundations',
    ]);
    expect(ids(coursesForPlatform(cameraRover, [seedCourse, free]))).toEqual([
      'ai-robotics-foundations',
    ]);
    expect(coursesForPlatform(sensorKit, [seedCourse, free])).toEqual([]);
  });
});

describe('mainPathwayId', () => {
  it('names the most frequent pathway, the first on a tie, null without one', () => {
    expect(
      mainPathwayId([
        course({ id: 'a', pathwayId: 'x' }),
        course({ id: 'b', pathwayId: 'y' }),
        course({ id: 'c', pathwayId: 'y' }),
      ]),
    ).toBe('y');
    expect(
      mainPathwayId([course({ id: 'a', pathwayId: 'x' }), course({ id: 'b', pathwayId: 'y' })]),
    ).toBe('x');
    expect(mainPathwayId([course({ id: 'a', pathwayId: null })])).toBeNull();
    expect(mainPathwayId([])).toBeNull();
  });
});

describe('the value lists', () => {
  it('are complete and distinct', () => {
    expect(new Set(HARDWARE_KINDS).size).toBe(4);
    expect(new Set(PROGRAMMING_MODES).size).toBe(4);
    expect(new Set(CONNECTIVITY).size).toBe(4);
  });
});
