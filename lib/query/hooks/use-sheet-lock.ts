"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  acquireSheetLock,
  releaseSheetLock,
  extendSheetLock,
  type LockResult,
} from "@/lib/firebase/db/sheet-locks";

interface UseLockOptions {
  autoExtend?: boolean;
  extensionInterval?: number;
}

export function useSheetLock(
  sheetId: string | null,
  userId: string | null,
  options: UseLockOptions = {}
) {
  const { autoExtend = true, extensionInterval = 5 * 60 * 1000 } = options;

  const [isLocked, setIsLocked] = useState(false);
  const [lockExpiry, setLockExpiry] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const extensionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isExtendingRef = useRef(false);
  // Refs for cleanup to avoid stale closures
  const lockStateRef = useRef({ isLocked: false, sheetId: sheetId, userId: userId });

  const acquire = useCallback(async (): Promise<LockResult> => {
    if (!sheetId || !userId) {
      return { success: false, error: "SHEET_NOT_FOUND" };
    }

    setError(null);
    const result = await acquireSheetLock(sheetId, userId);

    if (result.success) {
      setIsLocked(true);
      setLockExpiry(result.lockExpiry ?? null);
      lockStateRef.current = { isLocked: true, sheetId, userId };
    } else {
      setError(result.error ?? "Unknown error");
    }

    return result;
  }, [sheetId, userId]);

  const release = useCallback(async () => {
    if (!sheetId || !userId) return;

    const success = await releaseSheetLock(sheetId, userId);
    if (success) {
      setIsLocked(false);
      setLockExpiry(null);
      setError(null);
      lockStateRef.current.isLocked = false;
    }
  }, [sheetId, userId]);

  // Auto-extend lock
  useEffect(() => {
    if (!autoExtend || !isLocked || !sheetId || !userId) return;

    extensionTimerRef.current = setInterval(async () => {
      // Prevent concurrent extension requests
      if (isExtendingRef.current) return;
      isExtendingRef.current = true;

      try {
        const result = await extendSheetLock(sheetId, userId);
        if (result.success) {
          setLockExpiry(result.lockExpiry ?? null);
        } else {
          // Lost the lock
          setIsLocked(false);
          setLockExpiry(null);
          setError("Lock expired");
        }
      } finally {
        isExtendingRef.current = false;
      }
    }, extensionInterval);

    return () => {
      if (extensionTimerRef.current) {
        clearInterval(extensionTimerRef.current);
      }
    };
  }, [autoExtend, isLocked, sheetId, userId, extensionInterval]);

  // Release on unmount - uses ref to get current values
  useEffect(() => {
    return () => {
      const { isLocked: wasLocked, sheetId: sid, userId: uid } = lockStateRef.current;
      if (wasLocked && sid && uid) {
        releaseSheetLock(sid, uid).catch((err) => {
          console.error("Failed to release lock on unmount:", err);
        });
      }
    };
  }, []);

  return {
    isLocked,
    lockExpiry,
    error,
    acquire,
    release,
  };
}
