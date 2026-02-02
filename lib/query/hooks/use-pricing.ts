import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../client";
import {
  getPricingConfig,
  setPricingConfig,
  type PricingConfig,
} from "@/lib/firebase/db/pricing-config";

export function usePricingConfig() {
  return useQuery({
    queryKey: queryKeys.pricing.config(),
    queryFn: getPricingConfig,
    staleTime: 5 * 60 * 1000, // 5 minutes - rarely changes
  });
}

export function useUpdatePricingConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: PricingConfig) => setPricingConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pricing.all });
    },
  });
}
