import { useQuery } from '@tanstack/react-query';
import { fetchTopGainers, fetchTopDecliners, getTrendStats } from '@/lib/api/trends';
import type { Market } from '@/types/database';

export function useTopGainers(market?: Market, limit: number = 20) {
  return useQuery({
    queryKey: ['trends', 'gainers', market, limit],
    queryFn: () => fetchTopGainers({ market, limit }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useTopDecliners(market?: Market, limit: number = 20) {
  return useQuery({
    queryKey: ['trends', 'decliners', market, limit],
    queryFn: () => fetchTopDecliners({ market, limit }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useTrendStats() {
  return useQuery({
    queryKey: ['trends', 'stats'],
    queryFn: getTrendStats,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
