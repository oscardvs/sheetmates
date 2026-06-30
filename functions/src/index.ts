/**
 * SheetMates Cloud Functions (region: europe-west1)
 *
 *  - grantAdmin:          callable; lets an existing admin promote another user.
 *  - cleanupExpiredLocks: scheduled; releases stale sheet checkout locks.
 *  - cleanupGuestDrafts:  scheduled; deletes guest drafts older than 24h (GDPR).
 *
 * The very first admin is bootstrapped out-of-band via scripts/set-admin.ts.
 */
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";

initializeApp();
const db = getFirestore();
const auth = getAuth();

const REGION = "europe-west1";
const GUEST_DRAFT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Promote a user to admin. Caller must already be an admin (custom claim).
 * Sets both the `admin` custom claim and the `users/{uid}.role` field used by
 * the Firestore security rules.
 */
export const grantAdmin = onCall({ region: REGION }, async (request) => {
  if (request.auth?.token.admin !== true) {
    throw new HttpsError("permission-denied", "Caller is not an admin.");
  }

  const email = (request.data?.email as string | undefined)?.trim();
  if (!email) {
    throw new HttpsError("invalid-argument", "An `email` is required.");
  }

  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { admin: true });
  await db.collection("users").doc(user.uid).set(
    { role: "admin", updatedAt: Timestamp.now() },
    { merge: true }
  );

  logger.info(`Granted admin to ${email} (${user.uid})`);
  return { success: true, uid: user.uid };
});

/**
 * Release sheet checkout locks whose expiry has passed. Runs hourly.
 */
export const cleanupExpiredLocks = onSchedule(
  { schedule: "every 1 hours", region: REGION },
  async () => {
    const now = Timestamp.now();
    const expired = await db
      .collection("sheets")
      .where("lockExpiry", "<", now)
      .get();

    if (expired.empty) {
      logger.info("No expired locks to release.");
      return;
    }

    const batch = db.batch();
    expired.docs.forEach((doc) => {
      batch.update(doc.ref, {
        currentLockHolder: null,
        lockExpiry: null,
        lockAcquiredAt: null,
      });
    });
    await batch.commit();
    logger.info(`Released ${expired.size} expired sheet lock(s).`);
  }
);

/**
 * Delete guest drafts older than 24 hours. Runs every 6 hours.
 */
export const cleanupGuestDrafts = onSchedule(
  { schedule: "every 6 hours", region: REGION },
  async () => {
    const cutoff = Timestamp.fromMillis(Date.now() - GUEST_DRAFT_TTL_MS);
    const stale = await db
      .collection("guest_drafts")
      .where("createdAt", "<", cutoff)
      .get();

    if (stale.empty) {
      logger.info("No stale guest drafts to delete.");
      return;
    }

    const batch = db.batch();
    stale.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    logger.info(`Deleted ${stale.size} stale guest draft(s).`);
  }
);
