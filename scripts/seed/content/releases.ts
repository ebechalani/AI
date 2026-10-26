// Content added after a database was first seeded (ARCHITECTURE.md 11.7), oldest first. A
// release names only content that the course files of this folder already hold.

import type { ContentRelease } from '../types';

export const CONTENT_RELEASES: ContentRelease[] = [
  {
    id: '2026-10-longer-courses',
    summary:
      'Longer courses: two new courses (AI Engineering with Python, From Idea to AI Product) and two new modules in each of the five demo courses, with their new course details',
    newCourses: ['ai-engineering-with-python', 'from-idea-to-ai-product'],
    newModules: [
      { courseId: 'my-first-ai-adventure', moduleId: 'm3' },
      { courseId: 'my-first-ai-adventure', moduleId: 'm4' },
      { courseId: 'build-with-generative-ai', moduleId: 'm4' },
      { courseId: 'build-with-generative-ai', moduleId: 'm5' },
      { courseId: 'from-ai-user-to-ai-developer', moduleId: 'm4' },
      { courseId: 'from-ai-user-to-ai-developer', moduleId: 'm5' },
      { courseId: 'ai-robotics-foundations', moduleId: 'm4' },
      { courseId: 'ai-robotics-foundations', moduleId: 'm5' },
      { courseId: 'ai-essentials-for-educators', moduleId: 'm5' },
      { courseId: 'ai-essentials-for-educators', moduleId: 'm6' },
    ],
    // Fingerprints of the details as production holds them, from before this release: they are
    // not recomputed from the course files, which now hold the new details.
    courseDetails: [
      { courseId: 'my-first-ai-adventure', before: 'a56cf8724a9f0ec8' },
      { courseId: 'build-with-generative-ai', before: '4f1113cee12ed248' },
      { courseId: 'from-ai-user-to-ai-developer', before: '7ddb9e46628c7f45' },
      { courseId: 'ai-essentials-for-educators', before: '16eff9c9de186f81' },
      { courseId: 'ai-robotics-foundations', before: 'f0d8d3728cafd5f6' },
    ],
  },
];
