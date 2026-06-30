// Server-side only - do not import this file in client components.
//
// Lazily initializes the Firebase Admin SDK so that importing this module
// never throws at build time. Credentials are resolved in this order:
//   1. FIREBASE_SERVICE_ACCOUNT  - base64-encoded service account JSON
//   2. GOOGLE_APPLICATION_CREDENTIALS - path to a service account JSON file
//   3. Application Default Credentials - used automatically when running on
//      Firebase Hosting / Cloud Functions / Cloud Run in europe-west1.
import {
  initializeApp,
  getApps,
  getApp,
  cert,
  applicationDefault,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

let cachedApp: App | null = null;

function getAdminApp(): App {
  if (cachedApp) return cachedApp;
  if (getApps().length > 0) {
    cachedApp = getApp();
    return cachedApp;
  }

  const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountB64) {
    const json = JSON.parse(
      Buffer.from(serviceAccountB64, "base64").toString("utf8")
    );
    cachedApp = initializeApp({ credential: cert(json) });
    return cachedApp;
  }

  // GOOGLE_APPLICATION_CREDENTIALS or ADC (on GCP-hosted runtimes).
  cachedApp = initializeApp({ credential: applicationDefault() });
  return cachedApp;
}

export function adminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function adminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function adminStorage(): Storage {
  return getStorage(getAdminApp());
}

/** Default Storage bucket name (set on the public Firebase config). */
export function defaultBucketName(): string | undefined {
  return process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || undefined;
}
