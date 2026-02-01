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

  const acquire = useCallback(async (): Promise<LockResult> => {
    if (!sheetId || !userId) {
      return { success: false, error: "SHEET_NOT_FOUND" };
    }

    const result = await acquireSheetLock(sheetId, userId);

    if (result.success) {
      setIsLocked(true);
      setLockExpiry(result.lockExpiry ?? null);
      setError(null);
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
    }
  }, [sheetId, userId]);

  // Auto-extend lock
  useEffect(() => {
    if (!autoExtend || !isLocked || !sheetId || !userId) return;

    extensionTimerRef.current = setInterval(async () => {
      const result = await extendSheetLock(sheetId, userId);
      if (result.success) {
        setLockExpiry(result.lockExpiry ?? null);
      } else {
        // Lost the lock
        setIsLocked(false);
        setLockExpiry(null);
        setError("Lock expired");
      }
    }, extensionInterval);

    return () => {
      if (extensionTimerRef.current) {
        clearInterval(extensionTimerRef.current);
      }
    };
  }, [autoExtend, isLocked, sheetId, userId, extensionInterval]);

  // Release on unmount
  useEffect(() => {
    return () => {
      if (isLocked && sheetId && userId) {
        releaseSheetLock(sheetId, userId);
      }
    };
  }, [isLocked, sheetId, userId]);

  return {
    isLocked,
    lockExpiry,
    error,
    acquire,
    release,
  };
}
