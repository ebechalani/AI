import { headers } from 'next/headers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getAiEnv, getFirebaseWebConfig, getPublicEnv, getServerEnv, isEmulator } from '@/lib/env';
import { getClientApp, getClientAuth, getClientStorage } from '@/lib/firebase/client';
import {
  authorMediaPath,
  checkUpload,
  FILE_ID_PATTERN,
  FILE_NAME_PATTERN,
  isAllowedContentType,
  isPublicMediaPath,
  mediaUrl,
  officialMediaPath,
  sanitizeFileName,
  UPLOAD_LIMITS,
  uploadContentType,
  userUploadPath,
} from '@/lib/firebase/storage-paths';
import {
  AI_BUDGETS,
  FILE_ID_PATTERN as LIMITS_FILE_ID_PATTERN,
  FILE_NAME_PATTERN as LIMITS_FILE_NAME_PATTERN,
} from '@/lib/limits';
import { getClientKey, hashClientAddress } from '@/lib/request-meta';
import { parseInput } from '@/lib/schemas/common';
import { fileNameSchema } from '@/lib/schemas/submission';
import { FILE_KINDS, type FileKind } from '@/types';

vi.mock('next/headers', () => ({ headers: vi.fn() }));

const VARIABLES = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_USE_FIREBASE_EMULATORS',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_CONTACT_EMAIL',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_STORAGE_BUCKET',
  'FIRESTORE_EMULATOR_HOST',
  'FIREBASE_AUTH_EMULATOR_HOST',
  'FIREBASE_STORAGE_EMULATOR_HOST',
  'RATE_LIMIT_SECRET',
  'AI_PROVIDER',
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_MODEL',
  'AI_DAILY_TOKEN_BUDGET',
  'VERCEL',
] as const;

type Env = Partial<Record<(typeof VARIABLES)[number], string>>;

// Replaces the whole set, so a test never depends on the machine's own environment.
function setEnv(values: Env = {}): void {
  for (const name of VARIABLES) vi.stubEnv(name, values[name]);
}

const REAL: Env = {
  FIREBASE_PROJECT_ID: 'roboholic-prod',
  FIREBASE_CLIENT_EMAIL: 'firebase-adminsdk@roboholic-prod.iam.gserviceaccount.com',
  FIREBASE_PRIVATE_KEY: '"-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n"',
  FIREBASE_STORAGE_BUCKET: 'roboholic-prod.appspot.com',
  RATE_LIMIT_SECRET: 'a-secret-of-at-least-16-chars',
};

const EMULATOR_HOSTS = {
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
  FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9199',
} as const;

beforeEach(() => setEnv());
afterEach(() => vi.unstubAllEnvs());

describe('getServerEnv', () => {
  it('names every missing variable when nothing is set', () => {
    expect(() => getServerEnv()).toThrowError(
      'Invalid or missing environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_STORAGE_BUCKET, RATE_LIMIT_SECRET',
    );
  });

  it('reads a real project and restores the line breaks of the private key', () => {
    setEnv(REAL);
    const env = getServerEnv();
    expect(env.isEmulator).toBe(false);
    expect(env.firebase).toEqual({
      projectId: 'roboholic-prod',
      clientEmail: REAL.FIREBASE_CLIENT_EMAIL,
      privateKey: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n',
      storageBucket: 'roboholic-prod.appspot.com',
    });
    expect(env.rateLimitSecret).toBe(REAL.RATE_LIMIT_SECRET);
    expect(env.ai.provider).toBe('mock');
  });

  it('treats an empty value as not set', () => {
    setEnv({ ...REAL, FIREBASE_STORAGE_BUCKET: '  ' });
    expect(() => getServerEnv()).toThrowError(/: FIREBASE_STORAGE_BUCKET$/);
  });

  it('names a malformed variable without repeating its value', () => {
    setEnv({ ...REAL, RATE_LIMIT_SECRET: 'tooshort' });
    expect(() => getServerEnv()).toThrowError(/RATE_LIMIT_SECRET/);
    expect(() => getServerEnv()).not.toThrowError(/tooshort/);
  });

  it.each(Object.entries(EMULATOR_HOSTS))(
    'switches to the emulator when %s is set',
    (name, host) => {
      setEnv({ [name]: host });
      expect(getServerEnv()).toMatchObject({
        isEmulator: true,
        firebase: {
          projectId: 'demo-roboholic',
          clientEmail: null,
          privateKey: null,
          storageBucket: 'demo-roboholic.appspot.com',
        },
      });
      expect(getServerEnv().rateLimitSecret.length).toBeGreaterThanOrEqual(16);
    },
  );

  describe('emulator guard', () => {
    it.each(Object.entries(EMULATOR_HOSTS))(
      'refuses %s on Vercel, in any environment',
      (name, host) => {
        setEnv({ [name]: host, FIREBASE_PROJECT_ID: 'demo-roboholic', VERCEL: '1' });
        expect(() => getServerEnv()).toThrowError(/are set on Vercel/);
      },
    );

    it.each(Object.entries(EMULATOR_HOSTS))(
      'refuses %s with a project id that does not start with demo-',
      (name, host) => {
        setEnv({ ...REAL, [name]: host });
        expect(() => getServerEnv()).toThrowError(/does not start with "demo-"/);
      },
    );

    it('accepts any demo- project', () => {
      setEnv({
        ...EMULATOR_HOSTS,
        FIREBASE_PROJECT_ID: 'demo-ci',
        FIREBASE_STORAGE_BUCKET: 'demo-ci.appspot.com',
      });
      expect(getServerEnv().firebase).toMatchObject({
        projectId: 'demo-ci',
        storageBucket: 'demo-ci.appspot.com',
      });
    });

    it('does not fire on Vercel without emulator variables', () => {
      setEnv({ ...REAL, VERCEL: '1' });
      expect(getServerEnv().isEmulator).toBe(false);
    });
  });
});

describe('getPublicEnv', () => {
  it('works with nothing set', () => {
    expect(getPublicEnv()).toEqual({
      firebase: null,
      useEmulators: false,
      appUrl: 'http://localhost:3000',
      contactEmail: null,
    });
    expect(() => getFirebaseWebConfig()).toThrowError(/NEXT_PUBLIC_FIREBASE_/);
  });

  it('returns the web config only when it is complete', () => {
    const web: Env = {
      NEXT_PUBLIC_FIREBASE_API_KEY: 'key',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-roboholic.firebaseapp.com',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-roboholic',
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-roboholic.appspot.com',
    };
    setEnv(web);
    expect(getPublicEnv().firebase).toBeNull();

    setEnv({
      ...web,
      NEXT_PUBLIC_FIREBASE_APP_ID: 'app',
      NEXT_PUBLIC_USE_FIREBASE_EMULATORS: 'true',
      NEXT_PUBLIC_APP_URL: 'https://roboholic.example/',
      NEXT_PUBLIC_CONTACT_EMAIL: 'schools@roboholic.example',
    });
    expect(getPublicEnv()).toEqual({
      firebase: {
        apiKey: 'key',
        authDomain: 'demo-roboholic.firebaseapp.com',
        projectId: 'demo-roboholic',
        storageBucket: 'demo-roboholic.appspot.com',
        appId: 'app',
      },
      useEmulators: true,
      appUrl: 'https://roboholic.example',
      contactEmail: 'schools@roboholic.example',
    });
    expect(getFirebaseWebConfig().appId).toBe('app');
  });

  it('fails on a value that is present and malformed', () => {
    setEnv({ NEXT_PUBLIC_APP_URL: 'roboholic.example' });
    expect(() => getPublicEnv()).toThrowError(/NEXT_PUBLIC_APP_URL/);
  });
});

describe('getAiEnv', () => {
  it('defaults to the mock provider and the documented budget', () => {
    expect(getAiEnv()).toEqual({
      provider: 'mock',
      anthropicApiKey: null,
      anthropicModel: 'claude-opus-5-5',
      dailyTokenBudget: AI_BUDGETS.globalTokensPerDay,
    });
  });

  it('reads the real provider and a budget override', () => {
    setEnv({
      AI_PROVIDER: 'anthropic',
      ANTHROPIC_API_KEY: 'key',
      ANTHROPIC_MODEL: 'another-model',
      AI_DAILY_TOKEN_BUDGET: '250000',
    });
    expect(getAiEnv()).toEqual({
      provider: 'anthropic',
      anthropicApiKey: 'key',
      anthropicModel: 'another-model',
      dailyTokenBudget: 250_000,
    });
  });

  it('rejects an unknown provider or a budget that is not a positive integer', () => {
    setEnv({ AI_PROVIDER: 'other' });
    expect(() => getAiEnv()).toThrowError(/AI_PROVIDER/);
    setEnv({ AI_DAILY_TOKEN_BUDGET: 'lots' });
    expect(() => getAiEnv()).toThrowError(/AI_DAILY_TOKEN_BUDGET/);
  });
});

describe('isEmulator', () => {
  it('follows the public switch or any emulator host, and validates nothing', () => {
    expect(isEmulator()).toBe(false);
    setEnv({ NEXT_PUBLIC_USE_FIREBASE_EMULATORS: 'true' });
    expect(isEmulator()).toBe(true);
    setEnv({ FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', VERCEL: '1' });
    expect(isEmulator()).toBe(true);
  });
});

// --- The modules that read the environment on first use (src/lib/firebase, request-meta) --------

describe('Firebase Admin initialisation', () => {
  const cert = vi.fn((account: object) => ({ account }));
  const initializeApp = vi.fn((options: object, name: string) => ({ name, options }));
  const settings = vi.fn();
  const getFirestore = vi.fn(() => ({ settings }));
  const getAuth = vi.fn(() => ({}));
  const getStorage = vi.fn(() => ({ bucket: () => ({}) }));

  const SDK_MODULES = ['app', 'auth', 'firestore', 'storage'].map(
    (name) => `firebase-admin/${name}`,
  );
  // Where the module keeps its instances, so that they outlive a reload of the module.
  const adminGlobal = globalThis as typeof globalThis & { __roboholicAdmin?: unknown };

  /** A new copy of the module, as after a restart of the server (or an edit under next dev). */
  async function loadAdmin() {
    vi.resetModules();
    return import('@/lib/firebase/admin');
  }

  beforeEach(() => {
    // The module sets this variable itself on the emulators; stubbed so that it is restored.
    vi.stubEnv('METADATA_SERVER_DETECTION', undefined);
    delete adminGlobal.__roboholicAdmin;
    for (const mock of [cert, initializeApp, settings, getFirestore, getAuth, getStorage]) {
      mock.mockClear();
    }
    vi.doMock('firebase-admin/app', () => ({ cert, initializeApp }));
    vi.doMock('firebase-admin/auth', () => ({ getAuth }));
    vi.doMock('firebase-admin/firestore', async (importOriginal) => ({
      ...(await importOriginal<object>()),
      getFirestore,
    }));
    vi.doMock('firebase-admin/storage', () => ({ getStorage }));
  });

  afterEach(() => {
    for (const name of SDK_MODULES) vi.doUnmock(name);
    vi.resetModules();
    delete adminGlobal.__roboholicAdmin;
  });

  it('importing the server modules initialises nothing and needs no variable', async () => {
    await loadAdmin();
    await import('@/lib/firebase/collections');
    await import('@/lib/firebase/converters');
    await import('@/lib/firebase/storage-admin');
    expect(initializeApp).not.toHaveBeenCalled();
    expect(getFirestore).not.toHaveBeenCalled();
  });

  it('fails on first use, naming what is missing', async () => {
    const admin = await loadAdmin();
    for (const use of [
      admin.getAdminApp,
      admin.getAdminAuth,
      admin.getAdminDb,
      admin.getAdminBucket,
    ]) {
      expect(use).toThrowError(
        /^Invalid or missing environment variables: FIREBASE_PROJECT_ID, .*RATE_LIMIT_SECRET$/,
      );
    }
    expect(initializeApp).not.toHaveBeenCalled();
  });

  it.each(Object.entries(EMULATOR_HOSTS))(
    'with %s it targets the demo project and needs no key',
    async (name, host) => {
      setEnv({ [name]: host });
      (await loadAdmin()).getAdminApp();
      expect(initializeApp).toHaveBeenCalledExactlyOnceWith(
        { projectId: 'demo-roboholic', storageBucket: 'demo-roboholic.appspot.com' },
        'roboholic',
      );
      expect(initializeApp.mock.calls[0][0]).not.toHaveProperty('credential');
      expect(cert).not.toHaveBeenCalled();
      // No credential lookup on the emulators: see getAdminApp().
      expect(process.env.METADATA_SERVER_DETECTION).toBe('none');
    },
  );

  it('leaves an explicit METADATA_SERVER_DETECTION alone', async () => {
    setEnv(EMULATOR_HOSTS);
    vi.stubEnv('METADATA_SERVER_DETECTION', 'ping-only');
    (await loadAdmin()).getAdminApp();
    expect(process.env.METADATA_SERVER_DETECTION).toBe('ping-only');
  });

  it('is stopped by the emulator guard before anything is initialised', async () => {
    setEnv({ ...EMULATOR_HOSTS, VERCEL: '1' });
    expect((await loadAdmin()).getAdminApp).toThrowError(/are set on Vercel/);
    setEnv({ ...REAL, FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099' });
    expect((await loadAdmin()).getAdminAuth).toThrowError(/does not start with "demo-"/);
    expect(initializeApp).not.toHaveBeenCalled();
    expect(process.env.METADATA_SERVER_DETECTION).toBeUndefined();
  });

  it('with a real project it signs in as the service account', async () => {
    setEnv(REAL);
    (await loadAdmin()).getAdminApp();
    expect(cert).toHaveBeenCalledExactlyOnceWith({
      projectId: 'roboholic-prod',
      clientEmail: REAL.FIREBASE_CLIENT_EMAIL,
      privateKey: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n',
    });
    expect(initializeApp).toHaveBeenCalledExactlyOnceWith(
      {
        projectId: 'roboholic-prod',
        storageBucket: 'roboholic-prod.appspot.com',
        credential: cert.mock.results[0].value,
      },
      'roboholic',
    );
    expect(process.env.METADATA_SERVER_DETECTION).toBeUndefined();
  });

  it('initialises once: every getter returns the same instance', async () => {
    setEnv(EMULATOR_HOSTS);
    const admin = await loadAdmin();
    expect(admin.getAdminApp()).toBe(admin.getAdminApp());
    expect(admin.getAdminAuth()).toBe(admin.getAdminAuth());
    expect(admin.getAdminDb()).toBe(admin.getAdminDb());
    expect(admin.getAdminBucket()).toBe(admin.getAdminBucket());
    expect(initializeApp).toHaveBeenCalledTimes(1);
    // Firestore refuses a second settings() call.
    expect(settings).toHaveBeenCalledExactlyOnceWith({ ignoreUndefinedProperties: true });
  });

  it('keeps its instances when the module is evaluated again (next dev)', async () => {
    setEnv(EMULATOR_HOSTS);
    const first = await loadAdmin();
    const app = first.getAdminApp();
    const db = first.getAdminDb();

    const second = await loadAdmin();
    expect(second.getAdminApp).not.toBe(first.getAdminApp);
    expect(second.getAdminApp()).toBe(app);
    expect(second.getAdminDb()).toBe(db);
    expect(initializeApp).toHaveBeenCalledTimes(1);
    expect(settings).toHaveBeenCalledTimes(1);
  });
});

describe('Firebase client initialisation', () => {
  it('is lazy, and refuses to run on the server', () => {
    // Importing the module (top of this file) did nothing; using it outside a browser throws
    // before any configuration is read, since client auth state would be shared by every request.
    for (const use of [getClientApp, getClientAuth, getClientStorage]) {
      expect(use).toThrowError('The Firebase client SDK was used on the server.');
    }
  });
});

describe('storage paths', () => {
  const FILE_ID = '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b';
  const WEB: Env = {
    NEXT_PUBLIC_FIREBASE_API_KEY: 'key',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-roboholic.firebaseapp.com',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-roboholic',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-roboholic.appspot.com',
    NEXT_PUBLIC_FIREBASE_APP_ID: 'app',
  };

  it('re-exports the patterns of lib/limits', () => {
    expect(FILE_ID_PATTERN).toBe(LIMITS_FILE_ID_PATTERN);
    expect(FILE_NAME_PATTERN).toBe(LIMITS_FILE_NAME_PATTERN);
    expect(FILE_ID).toMatch(FILE_ID_PATTERN);
  });

  it('builds the three prefixes of the Storage rules', () => {
    expect(userUploadPath('uid-1', 'image', FILE_ID, 'photo.png')).toBe(
      `user-uploads/uid-1/image/${FILE_ID}/photo.png`,
    );
    expect(authorMediaPath('uid-1', FILE_ID, 'clip.mp4')).toBe(
      `course-media/authors/uid-1/${FILE_ID}/clip.mp4`,
    );
    expect(officialMediaPath(FILE_ID, 'cover.webp')).toBe(
      `course-media/official/${FILE_ID}/cover.webp`,
    );
  });

  it('refuses a segment that would address another folder', () => {
    for (const uid of ['', '..', 'a/b', '../uid-2', 'uid_1', 'uid 1']) {
      expect(() => userUploadPath(uid, 'image', FILE_ID, 'photo.png')).toThrowError(/uid/);
      expect(() => authorMediaPath(uid, FILE_ID, 'photo.png')).toThrowError(/uid/);
    }
    for (const fileId of ['', '..', 'not-a-uuid', `${FILE_ID}/x`, FILE_ID.toUpperCase()]) {
      expect(() => officialMediaPath(fileId, 'photo.png')).toThrowError(/file id/);
    }
    for (const fileName of ['', '.', '..', '...', 'a/b.png', '../b.png', 'a b.png', 'é.png']) {
      expect(() => officialMediaPath(FILE_ID, fileName)).toThrowError(/file name/);
      expect(() => userUploadPath('uid-1', 'pdf', FILE_ID, fileName)).toThrowError(/file name/);
    }
    expect(() => userUploadPath('uid-1', '../image' as FileKind, FILE_ID, 'a.png')).toThrowError(
      /file kind/,
    );
  });

  it('only official media is public', () => {
    expect(isPublicMediaPath(officialMediaPath(FILE_ID, 'cover.webp'))).toBe(true);
    expect(isPublicMediaPath(authorMediaPath('uid-1', FILE_ID, 'cover.webp'))).toBe(false);
    expect(isPublicMediaPath(userUploadPath('uid-1', 'image', FILE_ID, 'a.png'))).toBe(false);
    expect(isPublicMediaPath('course-media/officials/x')).toBe(false);
    expect(isPublicMediaPath('/course-media/official/x')).toBe(false);
  });

  describe('mediaUrl', () => {
    const official = { fileId: FILE_ID, storagePath: officialMediaPath(FILE_ID, 'cover.webp') };
    const object = `course-media%2Fofficial%2F${FILE_ID}%2Fcover.webp`;

    it('serves official media from Storage', () => {
      setEnv(WEB);
      expect(mediaUrl(official)).toBe(
        `https://firebasestorage.googleapis.com/v0/b/demo-roboholic.appspot.com/o/${object}?alt=media`,
      );
    });

    it('serves official media from the Storage emulator when the client uses it', () => {
      setEnv({ ...WEB, NEXT_PUBLIC_USE_FIREBASE_EMULATORS: 'true' });
      expect(mediaUrl(official)).toBe(
        `http://127.0.0.1:9199/v0/b/demo-roboholic.appspot.com/o/${object}?alt=media`,
      );
    });

    it('falls back to the route handler while the web config is not set', () => {
      expect(mediaUrl(official)).toBe(`/api/files/${FILE_ID}`);
    });

    it('sends everything else through the authorizing route handler', () => {
      setEnv(WEB);
      for (const storagePath of [
        userUploadPath('uid-1', 'image', FILE_ID, 'photo.png'),
        authorMediaPath('uid-1', FILE_ID, 'cover.webp'),
      ]) {
        expect(mediaUrl({ fileId: FILE_ID, storagePath })).toBe(`/api/files/${FILE_ID}`);
      }
    });
  });

  describe('sanitizeFileName', () => {
    it.each([
      ['photo.png', 'photo.png'],
      ['My Photo (1).PNG', 'My-Photo-1.png'],
      ['C:\\fakepath\\Rapport final.pdf', 'Rapport-final.pdf'],
      ['/home/lea/notes.txt', 'notes.txt'],
      ['élève à l’école.docx', 'eleve-a-l-ecole.docx'],
      ['صورة.png', 'file.png'],
      ['archive.tar.gz', 'archive.tar.gz'],
      ['a..b...c.txt', 'a.b.c.txt'],
      ['--weird--.name--.json', 'weird.name.json'],
      ['../../etc/passwd', 'passwd'],
      ['game 😀.SB3', 'game.sb3'],
      ['report.final_version2', 'report.final_version2'],
    ])('%j becomes %j', (name, expected) => {
      expect(sanitizeFileName(name)).toBe(expected);
    });

    it.each(['', '.', '..', '...', '. .', './.', '..\\..', '-.-', ' ', '\u0000', '.png', '...png'])(
      '%j never becomes a name made only of dots',
      (name) => {
        const result = sanitizeFileName(name);
        expect(result).toMatch(/^file(\.png)?$/);
        expect(parseInput(fileNameSchema, result).success).toBe(true);
      },
    );

    it('keeps the extension and stays within 100 characters', () => {
      const long = sanitizeFileName(`${'x'.repeat(150)}.webm`);
      expect(long).toHaveLength(100);
      expect(long.endsWith('.webm')).toBe(true);
      expect(sanitizeFileName('x'.repeat(150))).toHaveLength(100);
    });

    it('always yields a name the rules, the schema and the path builders accept', () => {
      const pieces = [
        '.',
        '.',
        '..',
        '-',
        '_',
        '/',
        '\\',
        ' ',
        'a',
        'Z',
        '9',
        'é',
        '😀',
        '\u0000',
        '%',
        ':',
      ];
      // A fixed pseudo-random sequence: the same names on every run.
      let seed = 20261002;
      const next = (bound: number) => {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        return seed % bound;
      };
      for (let round = 0; round < 3000; round += 1) {
        const name = Array.from({ length: next(40) }, () => pieces[next(pieces.length)]).join('');
        const result = sanitizeFileName(name);
        expect(result, JSON.stringify(name)).toMatch(FILE_NAME_PATTERN);
        expect(result, JSON.stringify(name)).not.toMatch(/^\.+$/);
        expect(parseInput(fileNameSchema, result).success, JSON.stringify(name)).toBe(true);
        expect(() => officialMediaPath(FILE_ID, result), JSON.stringify(name)).not.toThrow();
      }
    });
  });

  describe('upload limits', () => {
    const MB = 1024 * 1024;
    const OFFICE = 'application/vnd.openxmlformats-officedocument';

    it('are the table of ARCHITECTURE.md 5.2, which storage.rules repeats', () => {
      expect(Object.keys(UPLOAD_LIMITS)).toEqual([...FILE_KINDS]);
      expect(
        Object.fromEntries(FILE_KINDS.map((kind) => [kind, UPLOAD_LIMITS[kind].maxBytes / MB])),
      ).toEqual({ image: 10, audio: 25, video: 100, pdf: 20, file: 25 });
      expect(
        Object.fromEntries(FILE_KINDS.map((kind) => [kind, UPLOAD_LIMITS[kind].contentTypes])),
      ).toEqual({
        image: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
        audio: ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm'],
        video: ['video/mp4', 'video/webm', 'video/quicktime'],
        pdf: ['application/pdf'],
        file: [
          'application/zip',
          'text/plain',
          'text/csv',
          'application/json',
          `${OFFICE}.wordprocessingml.document`,
          `${OFFICE}.presentationml.presentation`,
          `${OFFICE}.spreadsheetml.sheet`,
          'application/x.scratch.sb3',
        ],
      });
      for (const kind of FILE_KINDS) {
        for (const extension of UPLOAD_LIMITS[kind].extensions) {
          expect(extension).toMatch(/^\.[a-z0-9]+$/);
        }
      }
    });

    it('never accept SVG, HTML, scripts or executables', () => {
      for (const kind of FILE_KINDS) {
        for (const [type, name] of [
          ['image/svg+xml', 'logo.svg'],
          ['text/html', 'page.html'],
          ['text/javascript', 'app.js'],
          ['application/x-msdownload', 'setup.exe'],
          ['application/octet-stream', 'setup.exe'],
          ['', 'unknown'],
        ]) {
          expect([kind, type, isAllowedContentType(kind, type, name)]).toEqual([kind, type, false]);
          expect(uploadContentType(kind, name, type)).toBeNull();
        }
      }
    });

    it('accept application/octet-stream only as a .sb3 or .ipynb file', () => {
      expect(isAllowedContentType('file', 'application/octet-stream', 'game.sb3')).toBe(true);
      expect(isAllowedContentType('file', 'application/octet-stream', 'notes.IPYNB')).toBe(true);
      expect(isAllowedContentType('file', 'application/octet-stream', 'sb3')).toBe(false);
      expect(isAllowedContentType('file', 'application/octet-stream', 'game.sb3.exe')).toBe(false);
      expect(isAllowedContentType('image', 'application/octet-stream', 'game.sb3')).toBe(false);
      // The list alone does not carry that rule: decide with checkUpload().
      expect(UPLOAD_LIMITS.file.contentTypes).not.toContain('application/octet-stream');
    });

    it('checkUpload answers with a validation key', () => {
      const pdf = { contentType: 'application/pdf', fileName: 'a.pdf' };
      expect(checkUpload('pdf', { ...pdf, sizeBytes: 20 * MB })).toBeNull();
      expect(checkUpload('pdf', { ...pdf, sizeBytes: 20 * MB + 1 })).toBe('file_too_large');
      expect(checkUpload('image', { ...pdf, sizeBytes: 1 })).toBe('file_type_not_allowed');
      expect(
        checkUpload('file', {
          contentType: 'Text/Plain; charset=utf-8',
          fileName: 'a.txt',
          sizeBytes: 1,
        }),
      ).toBeNull();
    });

    it('uploadContentType lets a known extension decide', () => {
      expect(uploadContentType('file', 'a.zip', 'application/x-zip-compressed')).toBe(
        'application/zip',
      );
      expect(uploadContentType('file', 'game.sb3', '')).toBe('application/x.scratch.sb3');
      expect(uploadContentType('file', 'notes.ipynb', '')).toBe('application/octet-stream');
      expect(uploadContentType('audio', 'voice.mp4', 'video/mp4')).toBe('audio/mp4');
      expect(uploadContentType('video', 'clip.MOV', '')).toBe('video/quicktime');
      expect(uploadContentType('file', 'notes', 'text/plain;charset=utf-8')).toBe('text/plain');
      // Whatever it returns passes the check that the rules and the server repeat.
      for (const kind of FILE_KINDS) {
        for (const extension of UPLOAD_LIMITS[kind].extensions) {
          const fileName = `x${extension}`;
          const contentType = uploadContentType(kind, fileName, 'application/whatever');
          expect(contentType).not.toBeNull();
          expect(
            checkUpload(kind, { contentType: contentType ?? '', fileName, sizeBytes: 1 }),
          ).toBeNull();
        }
      }
    });
  });
});

describe('getClientKey', () => {
  function requestFrom(values: Record<string, string>): void {
    vi.mocked(headers).mockResolvedValue(
      new Headers(values) as Awaited<ReturnType<typeof headers>>,
    );
  }

  beforeEach(() => setEnv(EMULATOR_HOSTS));

  it('is a keyed hash of the address, never the address', async () => {
    requestFrom({ 'x-real-ip': '203.0.113.7' });
    const key = await getClientKey();
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).toBe(hashClientAddress('203.0.113.7'));
    expect(await getClientKey()).toBe(key);
    requestFrom({ 'x-real-ip': '203.0.113.8' });
    expect(await getClientKey()).not.toBe(key);
  });

  it('depends on RATE_LIMIT_SECRET', () => {
    const onEmulator = hashClientAddress('203.0.113.7');
    setEnv(REAL);
    expect(hashClientAddress('203.0.113.7')).not.toBe(onEmulator);
    expect(hashClientAddress(' 2001:DB8::1 ')).toBe(hashClientAddress('2001:db8::1'));
  });

  it('prefers x-real-ip, then the first x-forwarded-for entry, then one shared key', async () => {
    requestFrom({ 'x-real-ip': '203.0.113.7', 'x-forwarded-for': '198.51.100.1, 10.0.0.1' });
    expect(await getClientKey()).toBe(hashClientAddress('203.0.113.7'));
    requestFrom({ 'x-forwarded-for': '198.51.100.1, 10.0.0.1' });
    expect(await getClientKey()).toBe(hashClientAddress('198.51.100.1'));
    requestFrom({});
    expect(await getClientKey()).toBe(hashClientAddress('unknown'));
  });

  it('fails without a secret outside the emulator, naming the variable', async () => {
    setEnv({ ...REAL, RATE_LIMIT_SECRET: undefined });
    requestFrom({ 'x-real-ip': '203.0.113.7' });
    await expect(getClientKey()).rejects.toThrowError(/RATE_LIMIT_SECRET/);
  });
});
