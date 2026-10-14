import { randomUUID } from 'node:crypto';
import {
  assertFails,
  assertSucceeds,
  type RulesTestContext,
  type RulesTestEnvironment,
  type TokenOptions,
} from '@firebase/rules-unit-testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FILE_KINDS, type FileKind } from '@/types';
import { NO_PROFILE_UID, seedProfiles, STALE_CLAIMS, startRulesEnvironment } from './helpers';

type Storage = ReturnType<RulesTestContext['storage']>;

// The table of ARCHITECTURE.md 5.2, written out a second time on purpose: the rules are checked
// against the contract's numbers, not against themselves.
const MB = 1024 * 1024;
const KINDS = {
  image: {
    maxBytes: 10 * MB,
    fileName: 'poster.png',
    contentTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  },
  audio: {
    maxBytes: 25 * MB,
    fileName: 'interview.mp3',
    contentTypes: ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm'],
  },
  video: {
    maxBytes: 100 * MB,
    fileName: 'robot-demo.mp4',
    contentTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
  },
  pdf: { maxBytes: 20 * MB, fileName: 'report.pdf', contentTypes: ['application/pdf'] },
  file: {
    maxBytes: 25 * MB,
    fileName: 'results.csv',
    contentTypes: [
      'application/zip',
      'text/plain',
      'text/csv',
      'application/json',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/x.scratch.sb3',
    ],
  },
} satisfies Record<FileKind, { maxBytes: number; fileName: string; contentTypes: string[] }>;

const ACCEPTED: [FileKind, string][] = FILE_KINDS.flatMap((kind) =>
  KINDS[kind].contentTypes.map((contentType): [FileKind, string] => [kind, contentType]),
);

const SMALL = 64;
const PNG = 'image/png';

const userUpload = (uid: string, kind: string, fileName: string, fileId: string = randomUUID()) =>
  `user-uploads/${uid}/${kind}/${fileId}/${fileName}`;
const authorMedia = (uid: string, fileName: string, fileId: string = randomUUID()) =>
  `course-media/authors/${uid}/${fileId}/${fileName}`;
const officialMedia = (fileName: string, fileId: string = randomUUID()) =>
  `course-media/official/${fileId}/${fileName}`;

let env: RulesTestEnvironment;
let bucket: string;

function storageFor(uid: string | null, claims?: TokenOptions): Storage {
  const context =
    uid === null ? env.unauthenticatedContext() : env.authenticatedContext(uid, claims);
  const storage = context.storage(`gs://${bucket}`);
  // A denied request fails at once; this only keeps an emulator fault from hanging a test.
  storage.setMaxUploadRetryTime(10_000);
  storage.setMaxOperationRetryTime(10_000);
  return storage;
}

async function upload(
  storage: Storage,
  path: string,
  contentType: string | null = PNG,
  bytes: number = SMALL,
): Promise<unknown> {
  const metadata = contentType === null ? undefined : { contentType };
  return await storage.ref(path).put(new Uint8Array(bytes), metadata);
}

/** Puts an object in place the way the server would, past the rules. */
async function seedObject(path: string, contentType: string = PNG): Promise<void> {
  await env.withSecurityRulesDisabled(async (context) => {
    await context.storage(`gs://${bucket}`).ref(path).put(new Uint8Array(SMALL), { contentType });
  });
}

function downloadStatus(path: string): Promise<number> {
  const { host, port } = env.emulators.storage!;
  const url = `http://${host}:${port}/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
  return fetch(url).then((response) => response.status);
}

async function expectNoReadAccess(storage: Storage, path: string): Promise<void> {
  const ref = storage.ref(path);
  await assertFails(ref.getMetadata());
  await assertFails(ref.getDownloadURL());
  await assertFails(ref.parent!.listAll());
}

async function expectNoChange(storage: Storage, path: string): Promise<void> {
  const ref = storage.ref(path);
  await assertFails(upload(storage, path));
  await assertFails(ref.updateMetadata({ contentType: 'text/html' }));
  await assertFails(ref.delete());
}

beforeAll(async () => {
  env = await startRulesEnvironment();
  bucket = `${env.projectId}.appspot.com`;
  await Promise.all([env.clearFirestore(), env.clearStorage()]);
  await seedProfiles(env);
});

afterAll(async () => {
  await env?.cleanup();
});

describe('user-uploads/{uid}/{kind}/{fileId}/{fileName}', () => {
  describe('create, by the owner', () => {
    it.each(ACCEPTED)('accepts kind %s with content type %s', async (kind, contentType) => {
      const path = userUpload('student-a', kind, KINDS[kind].fileName);
      await assertSucceeds(upload(storageFor('student-a'), path, contentType));
    });

    it.each(FILE_KINDS)(
      'accepts kind %s up to its size limit and not one byte more',
      async (kind) => {
        const { maxBytes, fileName, contentTypes } = KINDS[kind];
        const storage = storageFor('student-a');
        await assertSucceeds(
          upload(storage, userUpload('student-a', kind, fileName), contentTypes[0], maxBytes),
        );
        await assertFails(
          upload(storage, userUpload('student-a', kind, fileName), contentTypes[0], maxBytes + 1),
        );
      },
    );

    it('accepts application/octet-stream only as a Scratch project or a notebook', async () => {
      const storage = storageFor('student-a');
      const binary = 'application/octet-stream';
      for (const fileName of ['maze-game.sb3', 'analysis.ipynb', 'MAZE.SB3']) {
        await assertSucceeds(upload(storage, userUpload('student-a', 'file', fileName), binary));
      }
      for (const fileName of ['setup.exe', 'model.bin', 'sb3', 'game.sb3.exe', 'notes']) {
        await assertFails(upload(storage, userUpload('student-a', 'file', fileName), binary));
      }
      await assertFails(upload(storage, userUpload('student-a', 'image', 'maze-game.sb3'), binary));
    });

    it.each<[string, FileKind, string | null]>([
      ['an SVG as an image', 'image', 'image/svg+xml'],
      ['HTML as a file', 'file', 'text/html'],
      ['a script as a file', 'file', 'text/javascript'],
      ['an executable as a file', 'file', 'application/x-msdownload'],
      ['a PDF under the image kind', 'image', 'application/pdf'],
      ['an image under the pdf kind', 'pdf', 'image/png'],
      ['a video under the audio kind', 'audio', 'video/mp4'],
      ['an image without a content type', 'image', null],
      ['a content type with a parameter', 'file', 'text/html; charset=utf-8'],
    ])('refuses %s', async (_label, kind, contentType) => {
      const path = userUpload('student-a', kind, KINDS[kind].fileName);
      await assertFails(upload(storageFor('student-a'), path, contentType));
    });

    it('refuses a kind outside the five', async () => {
      const storage = storageFor('student-a');
      for (const kind of ['misc', 'Image', 'images', 'course_media']) {
        await assertFails(upload(storage, userUpload('student-a', kind, 'poster.png')));
      }
    });

    it('refuses a file id that is not a lowercase UUID', async () => {
      const storage = storageFor('student-a');
      const uuid = randomUUID();
      for (const fileId of [
        'poster',
        uuid.toUpperCase(),
        uuid.slice(1),
        `${uuid}0`,
        'g'.repeat(36),
      ]) {
        await assertFails(upload(storage, userUpload('student-a', 'image', 'poster.png', fileId)));
      }
    });

    it('accepts a sanitised file name of up to 100 characters', async () => {
      const storage = storageFor('student-a');
      for (const fileName of ['My_Poster-v2.final.png', '.hidden.png', `${'a'.repeat(96)}.png`]) {
        await assertSucceeds(upload(storage, userUpload('student-a', 'image', fileName)));
      }
    });

    it('refuses a file name outside [A-Za-z0-9._-]{1,100}', async () => {
      const storage = storageFor('student-a');
      for (const fileName of [
        'my poster.png',
        'affiche-été.png',
        'poster(1).png',
        'poster.png?alt=media',
        `${'a'.repeat(97)}.png`,
      ]) {
        await assertFails(upload(storage, userUpload('student-a', 'image', fileName)));
      }
    });

    it('refuses a file name made only of dots', async () => {
      const storage = storageFor('student-a');
      for (const fileName of ['.', '..', '...']) {
        await assertFails(upload(storage, userUpload('student-a', 'image', fileName)));
      }
    });

    it('refuses a path that is deeper or shallower than the contract', async () => {
      const storage = storageFor('student-a');
      const fileId = randomUUID();
      for (const path of [
        `user-uploads/student-a/image/${fileId}/nested/poster.png`,
        `user-uploads/student-a/image/poster.png`,
        `user-uploads/student-a/${fileId}/poster.png`,
        `user-uploads/student-a/poster.png`,
      ]) {
        await assertFails(upload(storage, path));
      }
    });
  });

  describe('create, by anyone else', () => {
    it.each<[string, string | null, TokenOptions | undefined]>([
      ['another student', 'student-b', undefined],
      ['the class teacher', 'teacher-a', undefined],
      ['the school admin', 'admin-a', undefined],
      ['the platform admin', 'platform', undefined],
      ['an anonymous caller', null, undefined],
    ])('refuses %s in a student’s folder', async (_label, uid, claims) => {
      const path = userUpload('student-a', 'image', 'poster.png');
      await assertFails(upload(storageFor(uid, claims), path));
    });

    it.each<[string, string, TokenOptions | undefined]>([
      ['an account without a profile', NO_PROFILE_UID, undefined],
      ['an account without a profile, whatever its claims', NO_PROFILE_UID, STALE_CLAIMS],
      ['a disabled student', 'disabled-student', undefined],
      ['a disabled platform admin', 'disabled-admin', undefined],
    ])('refuses %s in its own folder', async (_label, uid, claims) => {
      await assertFails(upload(storageFor(uid, claims), userUpload(uid, 'image', 'poster.png')));
    });

    it('accepts every active role in its own folder', async () => {
      for (const uid of ['student-b', 'solo', 'teacher-a', 'admin-a', 'platform', 'demoted']) {
        await assertSucceeds(upload(storageFor(uid), userUpload(uid, 'image', 'poster.png')));
      }
    });
  });

  describe('once uploaded', () => {
    const path = userUpload('student-a', 'image', 'poster.png');
    beforeAll(() => seedObject(path));

    it('is never readable through Storage, not even by its owner', async () => {
      for (const uid of ['student-a', 'student-b', 'teacher-a', 'admin-a', 'platform', null]) {
        await expectNoReadAccess(storageFor(uid), path);
      }
      expect(await downloadStatus(path)).toBe(403);
    });

    it('cannot be overwritten, changed or deleted from a client', async () => {
      for (const uid of ['student-a', 'teacher-a', 'platform']) {
        await expectNoChange(storageFor(uid), path);
      }
    });
  });
});

describe('course-media/authors/{uid}/{fileId}/{fileName}', () => {
  describe('create', () => {
    it.each(ACCEPTED)('accepts a teacher’s %s of content type %s', async (kind, contentType) => {
      const path = authorMedia('teacher-a', KINDS[kind].fileName);
      await assertSucceeds(upload(storageFor('teacher-a'), path, contentType));
    });

    it('accepts a platform admin in their own folder', async () => {
      await assertSucceeds(upload(storageFor('platform'), authorMedia('platform', 'cover.png')));
    });

    it.each<[string, string | null, string, TokenOptions | undefined]>([
      ['a student in their own folder', 'student-a', 'student-a', undefined],
      ['a school admin in their own folder', 'admin-a', 'admin-a', undefined],
      ['a teacher in a colleague’s folder', 'teacher-b', 'teacher-a', undefined],
      ['a platform admin in a teacher’s folder', 'platform', 'teacher-a', undefined],
      ['a disabled teacher', 'disabled-teacher', 'disabled-teacher', undefined],
      ['a former admin with stale claims', 'demoted', 'demoted', STALE_CLAIMS],
      ['a teacher claim without a profile', NO_PROFILE_UID, NO_PROFILE_UID, { role: 'teacher' }],
      ['an anonymous caller', null, 'teacher-a', undefined],
    ])('refuses %s', async (_label, uid, folder, claims) => {
      await assertFails(upload(storageFor(uid, claims), authorMedia(folder, 'cover.png')));
    });

    it('holds each content type to the size limit of its own kind', async () => {
      const storage = storageFor('teacher-a');
      await assertFails(upload(storage, authorMedia('teacher-a', 'cover.png'), PNG, 10 * MB + 1));
      await assertSucceeds(
        upload(storage, authorMedia('teacher-a', 'intro.mp4'), 'video/mp4', 10 * MB + 1),
      );
    });

    it('refuses content types outside the five kinds', async () => {
      const storage = storageFor('teacher-a');
      const binary = 'application/octet-stream';
      await assertFails(upload(storage, authorMedia('teacher-a', 'logo.svg'), 'image/svg+xml'));
      await assertFails(upload(storage, authorMedia('teacher-a', 'page.html'), 'text/html'));
      await assertFails(upload(storage, authorMedia('teacher-a', 'tool.exe'), binary));
      await assertSucceeds(upload(storage, authorMedia('teacher-a', 'starter.sb3'), binary));
    });

    it('refuses a malformed file id or file name', async () => {
      const storage = storageFor('teacher-a');
      await assertFails(upload(storage, authorMedia('teacher-a', 'cover.png', 'cover')));
      await assertFails(upload(storage, authorMedia('teacher-a', 'my cover.png')));
      await assertFails(upload(storage, authorMedia('teacher-a', '..')));
      await assertFails(upload(storage, `course-media/authors/teacher-a/cover.png`));
    });
  });

  describe('once uploaded', () => {
    const path = authorMedia('teacher-a', 'cover.png');
    beforeAll(() => seedObject(path));

    it('is never readable through Storage, not even by its author', async () => {
      for (const uid of ['teacher-a', 'student-a', 'admin-a', 'platform', null]) {
        await expectNoReadAccess(storageFor(uid), path);
      }
      expect(await downloadStatus(path)).toBe(403);
    });

    it('cannot be overwritten, changed or deleted from a client', async () => {
      for (const uid of ['teacher-a', 'platform']) await expectNoChange(storageFor(uid), path);
    });
  });
});

describe('course-media/official/{fileId}/{fileName}', () => {
  describe('create', () => {
    it.each(ACCEPTED)(
      'accepts a platform admin’s %s of content type %s',
      async (kind, contentType) => {
        const path = officialMedia(KINDS[kind].fileName);
        await assertSucceeds(upload(storageFor('platform'), path, contentType));
      },
    );

    it.each<[string, string | null, TokenOptions | undefined]>([
      ['a teacher', 'teacher-a', undefined],
      ['a school admin', 'admin-a', undefined],
      ['a student', 'student-a', undefined],
      ['a disabled platform admin', 'disabled-admin', undefined],
      ['a former admin with stale claims', 'demoted', STALE_CLAIMS],
      ['an admin claim without a profile', NO_PROFILE_UID, STALE_CLAIMS],
      ['an anonymous caller', null, undefined],
    ])('refuses %s', async (_label, uid, claims) => {
      await assertFails(upload(storageFor(uid, claims), officialMedia('cover.png')));
    });

    it('applies the same limits and name rules', async () => {
      const storage = storageFor('platform');
      await assertFails(upload(storage, officialMedia('cover.png'), PNG, 10 * MB + 1));
      await assertFails(upload(storage, officialMedia('logo.svg'), 'image/svg+xml'));
      await assertFails(upload(storage, officialMedia('cover.png', 'cover')));
      await assertFails(upload(storage, officialMedia('my cover.png')));
      await assertFails(upload(storage, officialMedia('.')));
      await assertFails(upload(storage, 'course-media/official/cover.png'));
    });
  });

  describe('once uploaded', () => {
    const path = officialMedia('cover.png');
    beforeAll(() => seedObject(path));

    it('is downloadable by anyone', async () => {
      for (const uid of [null, 'student-a', NO_PROFILE_UID]) {
        await assertSucceeds(storageFor(uid).ref(path).getMetadata());
      }
      expect(await downloadStatus(path)).toBe(200);
    });

    it('cannot be listed, so the media of a draft course stays unguessable', async () => {
      for (const uid of [null, 'student-a', 'platform']) {
        const storage = storageFor(uid);
        await assertFails(storage.ref(path).parent!.listAll());
        await assertFails(storage.ref('course-media/official').listAll());
      }
    });

    it('cannot be overwritten, changed or deleted from a client', async () => {
      for (const uid of ['platform', 'teacher-a']) await expectNoChange(storageFor(uid), path);
    });
  });
});

describe('every other path', () => {
  const paths = [
    'poster.png',
    'exports/users.csv',
    'course-media/cover.png',
    `course-media/drafts/${randomUUID()}/cover.png`,
    `submissions/student-a/${randomUUID()}/poster.png`,
  ];
  beforeAll(async () => {
    for (const path of paths) await seedObject(path);
  });

  it('is closed to reads and writes, for a platform admin too', async () => {
    for (const uid of ['platform', 'student-a', null]) {
      const storage = storageFor(uid);
      for (const path of paths) {
        await assertFails(storage.ref(path).getMetadata());
        await expectNoChange(storage, path);
        await assertFails(upload(storage, path.replace(/[^/]+$/, 'new.png')));
      }
      await assertFails(storage.ref().listAll());
    }
  });
});
