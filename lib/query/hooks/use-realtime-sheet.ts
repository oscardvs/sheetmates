"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../client";
import { subscribeToSheet, subscribeToOpenSheets } from "@/lib/firebase/db/subscriptions";
import type { SheetDoc } from "@/lib/firebase/db/sheets";

export function useRealtimeSheet(sheetId: string | null) {
  const [sheet, setSheet] = useState<SheetDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!sheetId) {
      setSheet(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToSheet(sheetId, (data) => {
      setSheet(data);
      setLoading(false);
      // Also update TanStack Query cache for consistency
      queryClient.setQueryData(queryKeys.sheets.detail(sheetId), data);
    });

    return () => unsubscribe();
  }, [sheetId, queryClient]);

  return { data: sheet, isLoading: loading };
}

export function useRealtimeOpenSheets() {
  const [sheets, setSheets] = useState<SheetDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeToOpenSheets((data) => {
      setSheets(data);
      setLoading(false);
      // Update query cache
      queryClient.setQueryData(queryKeys.sheets.list(), data);
    });

    return () => unsubscribe();
  }, [queryClient]);

  return { data: sheets, isLoading: loading };
}
