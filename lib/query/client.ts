import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 seconds
        refetchOnWindowFocus: true,
        retry: 1,
        placeholderData: (previousData: unknown) => previousData,
      },
      mutations: {
        retry: 1,
      },
    },
  });
}

// Query keys factory
export const queryKeys = {
  sheets: {
    all: ["sheets"] as const,
    list: () => [...queryKeys.sheets.all, "list"] as const,
    detail: (id: string) => [...queryKeys.sheets.all, "detail", id] as const,
    byStatus: (status: string) => [...queryKeys.sheets.all, "status", status] as const,
  },
  pricing: {
    all: ["pricing"] as const,
    config: () => [...queryKeys.pricing.all, "config"] as const,
  },
  orders: {
    all: ["orders"] as const,
    list: () => [...queryKeys.orders.all, "list"] as const,
    detail: (id: string) => [...queryKeys.orders.all, "detail", id] as const,
    byUser: (userId: string) => [...queryKeys.orders.all, "user", userId] as const,
  },
  parts: {
    all: ["parts"] as const,
    byUser: (userId: string) => [...queryKeys.parts.all, "user", userId] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
export type SheetQueryKeys = typeof queryKeys.sheets;
