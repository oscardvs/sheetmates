"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { FirestoreError } from "firebase/firestore";
import { queryKeys } from "../client";
import { subscribeToSheet, subscribeToOpenSheets } from "@/lib/firebase/db/subscriptions";
import type { SheetDoc } from "@/lib/firebase/db/sheets";

export function useRealtimeSheet(sheetId: string | null) {
  const [sheet, setSheet] = useState<SheetDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!sheetId) {
      setSheet(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const unsubscribe = subscribeToSheet(
      sheetId,
      (data) => {
        setSheet(data);
        setLoading(false);
        // Also update TanStack Query cache for consistency
        queryClient.setQueryData(queryKeys.sheets.detail(sheetId), data);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- queryClient is stable
  }, [sheetId]);

  return { data: sheet, isLoading: loading, error };
}

export function useRealtimeOpenSheets() {
  const [sheets, setSheets] = useState<SheetDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setError(null);
    const unsubscribe = subscribeToOpenSheets(
      (data) => {
        setSheets(data);
        setLoading(false);
        // Update query cache
        queryClient.setQueryData(queryKeys.sheets.list(), data);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- queryClient is stable
  }, []);

  return { data: sheets, isLoading: loading, error };
}
