import { useQuery } from '@tanstack/react-query';
import { fetchArbitrageOpportunities, getArbitrageStats } from '@/lib/api/arbitrage';
import type { ArbitrageOpportunity } from '@/types/arbitrage';

interface UseArbitrageOptions {
  minMargin?: number;
  minProfit?: number;
  limit?: number;
}

export function useArbitrageOpportunities(options: UseArbitrageOptions = {}) {
  return useQuery({
    queryKey: ['arbitrage-opportunities', options],
    queryFn: async (): Promise<ArbitrageOpportunity[]> => {
      const data = await fetchArbitrageOpportunities(options);
      return data ?? [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // 5 minutes
  });
}

export function useArbitrageStats() {
  return useQuery({
    queryKey: ['arbitrage-stats'],
    queryFn: async () => {
      return await getArbitrageStats();
    },
    staleTime: 1000 * 60 * 2,
  });
}
