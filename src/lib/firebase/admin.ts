import 'server-only';
import { cert, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getServerEnv } from '@/lib/env';

export type Bucket = ReturnType<ReturnType<typeof getStorage>['bucket']>;

// Named, so nothing else that initialises firebase-admin in the same process (a script, a
// test helper) can hand this module an app with other credentials or Firestore settings.
const APP_NAME = 'roboholic';

interface AdminState {
  app?: App;
  auth?: Auth;
  db?: Firestore;
  bucket?: Bucket;
}

// The singletons live on globalThis: `next dev` re-evaluates this module on every edit while
// firebase-admin stays loaded, and neither an app name nor Firestore settings can be set twice.
const globalForAdmin = globalThis as typeof globalThis & { __roboholicAdmin?: AdminState };
const state: AdminState = (globalForAdmin.__roboholicAdmin ??= {});

/**
 * Nothing runs when this module is imported: the environment is read, and the emulator guard
 * of getServerEnv() applied, on the first call. `next build` therefore needs no credentials,
 * and a misconfigured deployment fails on its first request, naming the variable.
 */
export function getAdminApp(): App {
  if (state.app) return state.app;
  const { firebase, isEmulator } = getServerEnv();

  if (isEmulator) {
    // With no credential, google-auth-library looks for a GCE metadata server on the first
    // Firestore call and waits some three seconds for the timeout, once per process (so once
    // per test file). Nothing on the emulators needs what it would find there.
    process.env.METADATA_SERVER_DETECTION ??= 'none';
  }

  // On the emulators the SDK reads the *_EMULATOR_HOST variables itself and needs no key.
  const credential =
    !isEmulator && firebase.clientEmail !== null && firebase.privateKey !== null
      ? cert({
          projectId: firebase.projectId,
          clientEmail: firebase.clientEmail,
          privateKey: firebase.privateKey,
        })
      : undefined;
  state.app = initializeApp(
    {
      projectId: firebase.projectId,
      storageBucket: firebase.storageBucket,
      ...(credential ? { credential } : {}),
    },
    APP_NAME,
  );
  return state.app;
}

export function getAdminAuth(): Auth {
  return (state.auth ??= getAuth(getAdminApp()));
}

export function getAdminDb(): Firestore {
  if (state.db) return state.db;
  const db = getFirestore(getAdminApp());
  // A patch object may carry `undefined` for a field the caller left alone; without this
  // setting Firestore rejects the whole write.
  db.settings({ ignoreUndefinedProperties: true });
  return (state.db = db);
}

/** The default bucket (FIREBASE_STORAGE_BUCKET). */
export function getAdminBucket(): Bucket {
  return (state.bucket ??= getStorage(getAdminApp()).bucket());
}
