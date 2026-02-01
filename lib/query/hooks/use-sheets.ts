import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../client";
import {
  getAllSheets,
  getSheet,
  createSheet,
  updateSheet,
  type SheetDoc,
} from "@/lib/firebase/db/sheets";

export function useSheets() {
  return useQuery({
    queryKey: queryKeys.sheets.list(),
    queryFn: getAllSheets,
  });
}

export function useSheet(id: string | null) {
  return useQuery({
    queryKey: queryKeys.sheets.detail(id ?? ""),
    queryFn: () => (id ? getSheet(id) : null),
    enabled: !!id,
  });
}

export function useOpenSheets() {
  const { data: sheets, ...rest } = useSheets();
  return {
    data: sheets?.filter((s) => s.status === "open"),
    ...rest,
  };
}

export function useCreateSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<SheetDoc, "id" | "createdAt">) => createSheet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sheets.all });
    },
  });
}

export function useUpdateSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<SheetDoc, "id" | "createdAt">> }) =>
      updateSheet(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sheets.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sheets.list() });
    },
  });
}
