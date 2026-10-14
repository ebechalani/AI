import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, initializeAuth, inMemoryPersistence, type Auth } from 'firebase/auth';
import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFirebaseWebConfig, getPublicEnv } from '@/lib/env';
import { STORAGE_EMULATOR_ORIGIN } from './storage-paths';

// The ports of firebase.json, on the host the development CSP of next.config.ts allows.
const AUTH_EMULATOR_URL = 'http://127.0.0.1:9099';

let auth: Auth | undefined;
let storage: FirebaseStorage | undefined;

/**
 * Lazy: nothing is initialised when this module is imported, so a build or a server render
 * with no web config does not fail. Browser only: client auth state is one object per
 * JavaScript realm, which on the server would be shared by every request.
 */
export function getClientApp(): FirebaseApp {
  if (typeof window === 'undefined') {
    throw new Error('The Firebase client SDK was used on the server.');
  }
  return getApps().length > 0 ? getApp() : initializeApp(getFirebaseWebConfig());
}

/**
 * In-memory persistence: nothing is written to IndexedDB or localStorage, so no Firebase
 * session outlives the tab on a shared classroom computer. The server session is the cookie.
 */
export function getClientAuth(): Auth {
  if (auth) return auth;
  const instance = initializeAuth(getClientApp(), { persistence: inMemoryPersistence });
  if (getPublicEnv().useEmulators && instance.emulatorConfig === null) {
    connectAuthEmulator(instance, AUTH_EMULATOR_URL, { disableWarnings: true });
  }
  return (auth = instance);
}

export function getClientStorage(): FirebaseStorage {
  if (storage) return storage;
  const instance = getStorage(getClientApp());
  if (getPublicEnv().useEmulators) {
    const { hostname, port } = new URL(STORAGE_EMULATOR_ORIGIN);
    connectStorageEmulator(instance, hostname, Number(port));
  }
  return (storage = instance);
}
