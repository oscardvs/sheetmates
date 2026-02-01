import {
  doc,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config";

const LOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export interface LockResult {
  success: boolean;
  error?: "ALREADY_LOCKED" | "SHEET_NOT_FOUND" | "SHEET_FULL";
  lockExpiry?: Date;
}

export async function acquireSheetLock(
  sheetId: string,
  userId: string
): Promise<LockResult> {
  const sheetRef = doc(db, "sheets", sheetId);

  try {
    return await runTransaction(db, async (transaction) => {
      const sheetDoc = await transaction.get(sheetRef);

      if (!sheetDoc.exists()) {
        return { success: false, error: "SHEET_NOT_FOUND" };
      }

      const data = sheetDoc.data();

      // Check if sheet is still open
      if (data.status !== "open") {
        return { success: false, error: "SHEET_FULL" };
      }

      // Check existing lock
      if (data.currentLockHolder && data.lockExpiry) {
        const lockExpiry = (data.lockExpiry as Timestamp).toDate();
        if (lockExpiry > new Date() && data.currentLockHolder !== userId) {
          return { success: false, error: "ALREADY_LOCKED" };
        }
      }

      // Acquire lock
      const expiry = new Date(Date.now() + LOCK_DURATION_MS);
      transaction.update(sheetRef, {
        currentLockHolder: userId,
        lockExpiry: Timestamp.fromDate(expiry),
        lockAcquiredAt: serverTimestamp(),
      });

      return { success: true, lockExpiry: expiry };
    });
  } catch (error) {
    console.error("Failed to acquire lock:", error);
    return { success: false, error: "ALREADY_LOCKED" };
  }
}

export async function releaseSheetLock(
  sheetId: string,
  userId: string
): Promise<boolean> {
  const sheetRef = doc(db, "sheets", sheetId);

  try {
    await runTransaction(db, async (transaction) => {
      const sheetDoc = await transaction.get(sheetRef);

      if (!sheetDoc.exists()) return;

      const data = sheetDoc.data();

      // Only release if we hold the lock
      if (data.currentLockHolder === userId) {
        transaction.update(sheetRef, {
          currentLockHolder: null,
          lockExpiry: null,
          lockAcquiredAt: null,
        });
      }
    });
    return true;
  } catch (error) {
    console.error("Failed to release lock:", error);
    return false;
  }
}

export async function extendSheetLock(
  sheetId: string,
  userId: string
): Promise<LockResult> {
  const sheetRef = doc(db, "sheets", sheetId);

  try {
    return await runTransaction(db, async (transaction) => {
      const sheetDoc = await transaction.get(sheetRef);

      if (!sheetDoc.exists()) {
        return { success: false, error: "SHEET_NOT_FOUND" };
      }

      const data = sheetDoc.data();

      // Must already hold the lock
      if (data.currentLockHolder !== userId) {
        return { success: false, error: "ALREADY_LOCKED" };
      }

      const expiry = new Date(Date.now() + LOCK_DURATION_MS);
      transaction.update(sheetRef, {
        lockExpiry: Timestamp.fromDate(expiry),
      });

      return { success: true, lockExpiry: expiry };
    });
  } catch (error) {
    console.error("Failed to extend lock:", error);
    return { success: false, error: "ALREADY_LOCKED" };
  }
}
